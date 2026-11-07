import logging
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql import extract

import email_service
import enrollment_routes
import lms_routes
import schema
from auth.hashing import hash_password, verify_password
from auth.jwt_handler import create_access_token
from auth.login_limiter import login_limiter
from auth.oauth2 import get_authenticated_user
from auth.role_checker import admin_only, all_users, teacher_admin
from database import get_db
from models import Course, Enrollment, EnrollmentRequest, Student, Teacher, User

load_dotenv()

logger = logging.getLogger("uvicorn.error")

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

# The interactive API docs stay on for development only
app = FastAPI(
    title="ITU LMS API",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)


# Registered before CORS so it runs inside it. Without this, a crash reaches the
# browser with no CORS headers and looks like the server is offline.
@app.middleware("http")
async def report_unexpected_errors(request, call_next):
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "The server hit an error. See the backend logs for details."}
        )

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"

    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


LOCAL_NETWORK_ORIGINS = r"http://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173"

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(","),
    # Lets phones and laptops on the same Wi-Fi use the dev site
    allow_origin_regex=None if IS_PRODUCTION else LOCAL_NETWORK_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lms_routes.router)
app.include_router(enrollment_routes.router)


@app.exception_handler(IntegrityError)
def handle_integrity_error(request, exc):
    return JSONResponse(
        status_code=409,
        content={"detail": "This conflicts with an existing record."}
    )


# -------------------------
# Shared helpers
# -------------------------

def apply_search(query, search, *columns):
    if not search:
        return query
    return query.filter(or_(*[column.ilike(f"%{search}%") for column in columns]))


def apply_sort(query, model, sort_by, order):
    """Sort on a real column only, so a bad query param can never cause a 500."""
    if sort_by == "teacher" and hasattr(model, "teacher"):
        query = query.outerjoin(model.teacher)
        column = Teacher.name
    else:
        column = model.__table__.columns.get(sort_by, model.__table__.columns["id"])

    direction = column.desc() if order.lower() == "desc" else column.asc()
    return query.order_by(direction, model.id)


def paginate(query, page, page_size):
    return query.offset((page - 1) * page_size).limit(page_size).all()


def ensure_email_available(db, email, current_user_id=None):
    """Login emails are shared across students, teachers and admins."""
    owner = db.query(User).filter(func.lower(User.email) == email.lower()).first()
    profile = (
        db.query(Student).filter(func.lower(Student.email) == email.lower()).first()
        or db.query(Teacher).filter(func.lower(Teacher.email) == email.lower()).first()
    )

    taken_by_other_user = owner is not None and owner.id != current_user_id
    taken_by_other_profile = profile is not None and profile.user_id != current_user_id

    if taken_by_other_user or taken_by_other_profile:
        raise HTTPException(status_code=400, detail="This email is already in use.")


def ensure_teacher_exists(db, teacher_id):
    if teacher_id is None:
        return
    if db.query(Teacher).filter(Teacher.id == teacher_id).first() is None:
        raise HTTPException(status_code=400, detail="Selected teacher does not exist.")


def ensure_course_code_available(db, code, course_id=None):
    existing = db.query(Course).filter(Course.code == code).first()
    if existing and existing.id != course_id:
        raise HTTPException(status_code=400, detail="Course code already exists.")


def create_login(db, name, email, role):
    password = email_service.generate_secure_password(10)
    user = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        first_login=True
    )
    db.add(user)
    return user, password


def email_login(profile, password, role):
    """Sent during the request so the admin learns whether it actually worked."""
    return email_service.send_welcome_email(
        name=profile.name,
        email=profile.email,
        password=password,
        role=role
    )


def created_response(profile, password, email_sent):
    """The password is only shown to the admin when the email could not be sent."""
    response = schema.StudentResponse.model_validate(profile).model_dump() \
        if isinstance(profile, Student) \
        else schema.TeacherResponse.model_validate(profile).model_dump()

    return {
        **response,
        "email_sent": email_sent,
        "temporary_password": None if email_sent else password,
    }


def reset_login(db, profile, role):
    """Creates the profile's login, or replaces its password, and emails it."""
    if profile.user is None:
        profile.user, password = create_login(db, profile.name, profile.email, role)
    else:
        password = email_service.generate_secure_password(10)
        profile.user.hashed_password = hash_password(password)
        profile.user.first_login = True

    db.commit()

    return {
        "email": profile.email,
        "temporary_password": password,
        "email_sent": email_login(profile, password, role),
    }


def get_student_or_404(db, student_id):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def get_teacher_or_404(db, teacher_id):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


def get_course_or_404(db, course_id):
    return lms_routes.get_course(db, course_id)


def visible_students_query(db, user):
    """Teachers only see their advisees and the students in their courses."""
    query = db.query(Student)

    if user.role == "teacher":
        teacher = lms_routes.current_teacher(db, user)
        enrolled = (
            db.query(Enrollment.student_id)
            .join(Course, Enrollment.course_id == Course.id)
            .filter(Course.teacher_id == teacher.id)
        )
        query = query.filter(or_(Student.teacher_id == teacher.id, Student.id.in_(enrolled)))

    return query


# -------------------------
# Health
# -------------------------

@app.get("/health")
def health():
    """Liveness only. Touching the database here would stop it ever going idle."""
    return {"status": "ok"}


# -------------------------
# Auth
# -------------------------

@app.post("/login")
def login(
    request: schema.UserLogin,
    db: Session = Depends(get_db)
):

    email = request.email.strip().lower()

    if login_limiter.is_locked(email):
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Try again in a few minutes."
        )

    user = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        login_limiter.record_failure(email)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    login_limiter.reset(email)

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "first_login": user.first_login
    }


@app.post("/change-password")
def change_password(
    request: schema.ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
):

    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current one"
        )

    current_user.hashed_password = hash_password(request.new_password)
    current_user.first_login = False

    db.commit()

    return {
        "message": "Password changed successfully"
    }


# -------------------------
# Dashboard
# -------------------------

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


@app.get(
    "/dashboard",
    response_model=schema.DashboardResponse
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    gender_data = (
        db.query(Student.gender, func.count(Student.id))
        .group_by(Student.gender)
        .all()
    )

    students_teacher_data = (
        db.query(Teacher.name, func.count(Student.id))
        .outerjoin(Student, Student.teacher_id == Teacher.id)
        .group_by(Teacher.id)
        .all()
    )

    courses_teacher_data = (
        db.query(Teacher.name, func.count(Course.id))
        .outerjoin(Course, Course.teacher_id == Teacher.id)
        .group_by(Teacher.id)
        .all()
    )

    month = extract("month", Student.created_at)

    month_data = (
        db.query(month, func.count(Student.id))
        .group_by(month)
        .order_by(month)
        .all()
    )

    recent_students = (
        db.query(Student)
        .order_by(Student.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "students": db.query(Student).count(),
        "teachers": db.query(Teacher).count(),
        "courses": db.query(Course).count(),
        "enrollments": db.query(Enrollment).count(),
        "pendingRequests": db.query(EnrollmentRequest).filter(EnrollmentRequest.status == "pending").count(),
        "studentsWithoutLogin": db.query(Student).filter(Student.user_id.is_(None)).count(),
        "teachersWithoutLogin": db.query(Teacher).filter(Teacher.user_id.is_(None)).count(),
        "gender": [{"name": g, "value": count} for g, count in gender_data],
        "studentsPerTeacher": [
            {"teacher": teacher, "students": count}
            for teacher, count in students_teacher_data
        ],
        "coursesPerTeacher": [
            {"teacher": teacher, "courses": count}
            for teacher, count in courses_teacher_data
        ],
        "studentsPerMonth": [
            {"month": MONTH_NAMES[int(m) - 1], "students": count}
            for m, count in month_data
        ],
        "recentStudents": recent_students,
    }


# -------------------------
# Courses
# -------------------------

@app.get("/courses", response_model=schema.CourseListResponse)
def get_courses(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("id"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    query = apply_search(db.query(Course), search, Course.name, Course.code)

    total = query.count()

    courses = paginate(apply_sort(query, Course, sort_by, order), page, page_size)

    return {
        "data": courses,
        "total": total
    }


@app.post(
    "/courses",
    response_model=schema.CourseResponse
)
def create_course(
    course: schema.CreateCourse,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    ensure_course_code_available(db, course.code)
    ensure_teacher_exists(db, course.teacher_id)

    db_course = Course(**course.model_dump())

    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    return db_course


@app.put(
    "/courses/{course_id}",
    response_model=schema.CourseResponse
)
def update_course(
    course_id: int,
    course: schema.UpdateCourse,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    db_course = get_course_or_404(db, course_id)

    ensure_course_code_available(db, course.code, course_id)
    ensure_teacher_exists(db, course.teacher_id)

    for key, value in course.model_dump().items():
        setattr(db_course, key, value)

    db.commit()
    db.refresh(db_course)

    return db_course


@app.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    db.delete(get_course_or_404(db, course_id))
    db.commit()

    return {
        "message": "Course deleted successfully"
    }


# -------------------------
# Teachers
# -------------------------

@app.get("/teachers", response_model=schema.TeacherListResponse)
def get_teachers(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("id"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    query = apply_search(
        db.query(Teacher),
        search,
        Teacher.name,
        Teacher.email,
        Teacher.subject,
        Teacher.department
    )

    total = query.count()

    teachers = paginate(apply_sort(query, Teacher, sort_by, order), page, page_size)

    return {
        "data": teachers,
        "total": total
    }


@app.post("/teachers", response_model=schema.TeacherCreated)
def create_teacher(
    teacher: schema.CreateTeacher,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    ensure_email_available(db, teacher.email)

    db_user, password = create_login(db, teacher.name, teacher.email, "teacher")

    db_teacher = Teacher(**teacher.model_dump(), user=db_user)

    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)

    return created_response(db_teacher, password, email_login(db_teacher, password, "teacher"))


@app.put(
    "/teachers/{teacher_id}",
    response_model=schema.TeacherResponse
)
def update_teacher(
    teacher_id: int,
    teacher: schema.CreateTeacher,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    db_teacher = get_teacher_or_404(db, teacher_id)

    ensure_email_available(db, teacher.email, db_teacher.user_id)

    for key, value in teacher.model_dump().items():
        setattr(db_teacher, key, value)

    if db_teacher.user:
        db_teacher.user.name = teacher.name
        db_teacher.user.email = teacher.email

    db.commit()
    db.refresh(db_teacher)

    return db_teacher


@app.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    teacher = get_teacher_or_404(db, teacher_id)

    if teacher.user:
        db.delete(teacher.user)

    db.delete(teacher)
    db.commit()

    return {
        "message": "Teacher deleted successfully"
    }


@app.post("/teachers/{teacher_id}/reset-login", response_model=schema.TemporaryLogin)
def reset_teacher_login(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    return reset_login(db, get_teacher_or_404(db, teacher_id), "teacher")


# -------------------------
# Students
# -------------------------

@app.get("/students", response_model=schema.StudentListResponse)
def get_students(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("id"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    query = apply_search(
        visible_students_query(db, current_user),
        search,
        Student.name,
        Student.email,
        Student.gender
    )

    total = query.count()

    students = paginate(apply_sort(query, Student, sort_by, order), page, page_size)

    return {
        "data": students,
        "total": total
    }


@app.get("/students/{student_id}", response_model=schema.StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    student = get_student_or_404(db, student_id)

    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission Denied")

    if current_user.role == "teacher":
        visible = visible_students_query(db, current_user).filter(Student.id == student_id)
        if visible.first() is None:
            raise HTTPException(status_code=403, detail="Permission Denied")

    return student


@app.post(
    "/students",
    response_model=schema.StudentCreated
)
def create_student(
    student: schema.CreateStudent,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    ensure_email_available(db, student.email)
    ensure_teacher_exists(db, student.teacher_id)

    db_user, password = create_login(db, student.name, student.email, "student")

    db_student = Student(**student.model_dump(), user=db_user)

    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return created_response(db_student, password, email_login(db_student, password, "student"))


@app.put(
    "/students/{student_id}",
    response_model=schema.StudentResponse
)
def update_student(
    student_id: int,
    student: schema.UpdateStudent,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    db_student = get_student_or_404(db, student_id)

    ensure_email_available(db, student.email, db_student.user_id)
    ensure_teacher_exists(db, student.teacher_id)

    for key, value in student.model_dump().items():
        setattr(db_student, key, value)

    if db_student.user:
        db_student.user.name = student.name
        db_student.user.email = student.email

    db.commit()
    db.refresh(db_student)

    return db_student


@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    student = get_student_or_404(db, student_id)

    if student.user:
        db.delete(student.user)

    db.delete(student)
    db.commit()

    return {
        "message": "Student deleted successfully"
    }


@app.post("/students/{student_id}/reset-login", response_model=schema.TemporaryLogin)
def reset_student_login(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    return reset_login(db, get_student_or_404(db, student_id), "student")
