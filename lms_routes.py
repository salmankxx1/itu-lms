from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import schema
from auth.oauth2 import get_authenticated_user
from auth.role_checker import admin_only, all_users, student_only, teacher_admin
from database import get_db
from models import (
    Announcement,
    Assignment,
    AttendanceRecord,
    Course,
    CourseMaterial,
    Enrollment,
    Student,
    Submission,
    Teacher,
    User,
)

router = APIRouter()

# Percentage floor, letter, grade points (common Pakistani university scale)
GRADE_SCALE = [
    (85, "A", 4.0),
    (80, "A-", 3.67),
    (75, "B+", 3.33),
    (71, "B", 3.0),
    (68, "B-", 2.67),
    (64, "C+", 2.33),
    (61, "C", 2.0),
    (58, "C-", 1.67),
    (54, "D+", 1.33),
    (50, "D", 1.0),
    (0, "F", 0.0),
]


# -------------------------
# Lookups and permissions
# -------------------------

def current_student(db, user):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="No student profile for this account")
    return student


def current_teacher(db, user):
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="No teacher profile for this account")
    return teacher


def get_course(db, course_id):
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def get_assignment(db, assignment_id):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


def can_manage_course(course, user):
    if user.role == "admin":
        return True
    return user.role == "teacher" and course.teacher is not None and course.teacher.user_id == user.id


def is_enrolled(db, course, user):
    if user.role != "student":
        return False
    return (
        db.query(Enrollment)
        .join(Student, Enrollment.student_id == Student.id)
        .filter(Enrollment.course_id == course.id, Student.user_id == user.id)
        .first()
    ) is not None


def require_manager(course, user):
    if not can_manage_course(course, user):
        raise HTTPException(status_code=403, detail="Permission Denied")


def require_member(db, course, user):
    if not can_manage_course(course, user) and not is_enrolled(db, course, user):
        raise HTTPException(status_code=403, detail="You are not part of this course")


# -------------------------
# Calculations
# -------------------------

def as_utc(value):
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def letter_for(percent):
    if percent is None:
        return None
    return next(letter for floor, letter, _ in GRADE_SCALE if percent >= floor)


def points_for(letter):
    return next(points for _, name, points in GRADE_SCALE if name == letter)


def course_percent(db, course_id, student_id):
    """Graded work so far, so ungraded assignments never count against a student."""
    earned, possible = (
        db.query(func.sum(Submission.score), func.sum(Assignment.max_points))
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .filter(
            Assignment.course_id == course_id,
            Submission.student_id == student_id,
            Submission.score.isnot(None),
        )
        .one()
    )
    return round(earned * 100 / possible, 1) if possible else None


def attendance_percent(db, student_id, course_id=None):
    query = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id)
    if course_id is not None:
        query = query.filter(AttendanceRecord.course_id == course_id)

    records = query.all()
    if not records:
        return None

    attended = sum(1 for record in records if record.status != "absent")
    return round(attended * 100 / len(records), 1)


def enrolled_count(db, course_id):
    return db.query(Enrollment).filter(Enrollment.course_id == course_id).count()


def enrolled_students(db, course_id):
    return (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(Enrollment.course_id == course_id)
        .order_by(Student.name)
        .all()
    )


def pending_grading_count(db, course_ids):
    if not course_ids:
        return 0
    return (
        db.query(Submission)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .filter(Assignment.course_id.in_(course_ids), Submission.score.is_(None))
        .count()
    )


def student_grades(db, student):
    courses = [enrollment.course for enrollment in student.enrollments]
    rows = []
    points = 0
    credits = 0

    for course in courses:
        percent = course_percent(db, course.id, student.id)
        letter = letter_for(percent)
        if letter:
            points += points_for(letter) * course.credit_hours
            credits += course.credit_hours
        rows.append(
            {
                "course_id": course.id,
                "code": course.code,
                "name": course.name,
                "credit_hours": course.credit_hours,
                "percent": percent,
                "letter": letter,
            }
        )

    return {"courses": rows, "gpa": round(points / credits, 2) if credits else None}


# -------------------------
# Serializers
# -------------------------

def announcement_json(announcement, user):
    return {
        "id": announcement.id,
        "title": announcement.title,
        "body": announcement.body,
        "course_id": announcement.course_id,
        "course_code": announcement.course.code if announcement.course else None,
        "author_name": announcement.author.name if announcement.author else None,
        "created_at": announcement.created_at,
        "can_delete": user.role == "admin" or announcement.author_id == user.id,
    }


def submission_json(submission):
    return {
        "id": submission.id,
        "student_id": submission.student_id,
        "student_name": submission.student.name,
        "content": submission.content,
        "submitted_at": submission.submitted_at,
        "is_late": as_utc(submission.submitted_at) > as_utc(submission.assignment.due_date),
        "score": submission.score,
        "feedback": submission.feedback,
    }


def assignment_json(db, assignment, user):
    data = {
        "id": assignment.id,
        "course_id": assignment.course_id,
        "title": assignment.title,
        "description": assignment.description,
        "due_date": assignment.due_date,
        "max_points": assignment.max_points,
    }

    if can_manage_course(assignment.course, user):
        data["submission_count"] = len(assignment.submissions)
        data["graded_count"] = sum(1 for s in assignment.submissions if s.score is not None)
    elif user.role == "student":
        student = current_student(db, user)
        mine = next((s for s in assignment.submissions if s.student_id == student.id), None)
        data["my_submission"] = submission_json(mine) if mine else None

    return data


def upcoming_assignments(db, course_ids, student=None):
    if not course_ids:
        return []

    assignments = (
        db.query(Assignment)
        .filter(
            Assignment.course_id.in_(course_ids),
            Assignment.due_date >= datetime.now(timezone.utc),
        )
        .order_by(Assignment.due_date)
        .limit(6)
        .all()
    )

    return [
        {
            "id": assignment.id,
            "title": assignment.title,
            "course_id": assignment.course_id,
            "course_code": assignment.course.code,
            "due_date": assignment.due_date,
            "submitted": student is not None
            and any(s.student_id == student.id for s in assignment.submissions),
        }
        for assignment in assignments
    ]


def visible_announcements(db, user):
    query = db.query(Announcement)

    if user.role == "student":
        course_ids = [e.course_id for e in current_student(db, user).enrollments]
    elif user.role == "teacher":
        course_ids = [c.id for c in current_teacher(db, user).courses]
    else:
        course_ids = None

    if course_ids is not None:
        query = query.filter(
            or_(Announcement.course_id.is_(None), Announcement.course_id.in_(course_ids))
        )

    return query.order_by(Announcement.created_at.desc(), Announcement.id.desc())


# -------------------------
# Me
# -------------------------

@router.get("/me", response_model=schema.MeResponse)
def get_me(current_user: User = Depends(get_authenticated_user)):
    return current_user


@router.get("/me/overview", response_model=schema.Overview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    announcements = [
        announcement_json(a, current_user)
        for a in visible_announcements(db, current_user).limit(5).all()
    ]

    if current_user.role == "student":
        student = current_student(db, current_user)
        grades = {g["course_id"]: g for g in student_grades(db, student)["courses"]}
        courses = [e.course for e in student.enrollments]

        return {
            "name": student.name,
            "role": "student",
            "detail": student.email,
            "courses": [
                {
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "credit_hours": c.credit_hours,
                    "teacher_name": c.teacher.name if c.teacher else None,
                    "enrolled_count": enrolled_count(db, c.id),
                    "attendance_percent": attendance_percent(db, student.id, c.id),
                    "percent": grades[c.id]["percent"],
                    "letter": grades[c.id]["letter"],
                }
                for c in courses
            ],
            "upcoming": upcoming_assignments(db, [c.id for c in courses], student),
            "announcements": announcements,
            "gpa": student_grades(db, student)["gpa"],
            "attendance_percent": attendance_percent(db, student.id),
        }

    if current_user.role == "teacher":
        teacher = current_teacher(db, current_user)
        course_ids = [c.id for c in teacher.courses]
        students_total = (
            db.query(func.count(func.distinct(Enrollment.student_id)))
            .filter(Enrollment.course_id.in_(course_ids))
            .scalar()
            if course_ids else 0
        )

        return {
            "name": teacher.name,
            "role": "teacher",
            "detail": f"{teacher.subject} • {teacher.department}",
            "courses": [
                {
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "credit_hours": c.credit_hours,
                    "teacher_name": teacher.name,
                    "enrolled_count": enrolled_count(db, c.id),
                    "pending_grading": pending_grading_count(db, [c.id]),
                }
                for c in teacher.courses
            ],
            "upcoming": upcoming_assignments(db, course_ids),
            "announcements": announcements,
            "students_total": students_total,
            "pending_grading": pending_grading_count(db, course_ids),
        }

    return {
        "name": current_user.name,
        "role": current_user.role,
        "detail": current_user.email,
        "courses": [],
        "upcoming": [],
        "announcements": announcements,
    }


@router.get("/me/grades", response_model=schema.MyGrades)
def get_my_grades(
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):
    return student_grades(db, current_student(db, current_user))


# -------------------------
# Course space
# -------------------------

@router.get("/courses/{course_id}", response_model=schema.CourseDetail)
def get_course_detail(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    course = get_course(db, course_id)

    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "credit_hours": course.credit_hours,
        "description": course.description,
        "teacher_id": course.teacher_id,
        "teacher": course.teacher,
        "enrolled_count": enrolled_count(db, course.id),
        "can_manage": can_manage_course(course, current_user),
        "is_enrolled": is_enrolled(db, course, current_user),
    }


@router.get("/courses/{course_id}/enrollments", response_model=list[schema.EnrolledStudent])
def get_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    return enrolled_students(db, course_id)


@router.post("/courses/{course_id}/enrollments", response_model=schema.EnrolledStudent)
def enroll_student(
    course_id: int,
    enrollment: schema.EnrollStudent,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    get_course(db, course_id)

    student = db.query(Student).filter(Student.id == enrollment.student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled.")

    db.add(Enrollment(course_id=course_id, student_id=student.id))

    # Imported here because enrollment_routes depends on this module
    from enrollment_routes import approve_pending_request
    approve_pending_request(db, student.id, course_id, current_user)

    db.commit()

    return student


@router.delete("/courses/{course_id}/enrollments/{student_id}")
def unenroll_student(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student_id
    ).first()

    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    db.delete(enrollment)
    db.commit()

    return {"message": "Student removed from course"}


# -------------------------
# Announcements
# -------------------------

@router.get("/announcements", response_model=list[schema.AnnouncementResponse])
def get_announcements(
    course_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    query = visible_announcements(db, current_user)

    if course_id is not None:
        require_member(db, get_course(db, course_id), current_user)
        query = query.filter(Announcement.course_id == course_id)

    return [announcement_json(a, current_user) for a in query.limit(100).all()]


@router.post("/announcements", response_model=schema.AnnouncementResponse)
def create_announcement(
    announcement: schema.CreateAnnouncement,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    if announcement.course_id is None:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can post campus-wide")
    else:
        require_manager(get_course(db, announcement.course_id), current_user)

    db_announcement = Announcement(**announcement.model_dump(), author_id=current_user.id)

    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)

    return announcement_json(db_announcement, current_user)


@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()

    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if current_user.role != "admin" and announcement.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission Denied")

    db.delete(announcement)
    db.commit()

    return {"message": "Announcement deleted"}


# -------------------------
# Materials
# -------------------------

@router.get("/courses/{course_id}/materials", response_model=list[schema.MaterialResponse])
def get_materials(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    require_member(db, get_course(db, course_id), current_user)

    return (
        db.query(CourseMaterial)
        .filter(CourseMaterial.course_id == course_id)
        .order_by(CourseMaterial.created_at.desc(), CourseMaterial.id.desc())
        .all()
    )


@router.post("/courses/{course_id}/materials", response_model=schema.MaterialResponse)
def create_material(
    course_id: int,
    material: schema.CreateMaterial,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    db_material = CourseMaterial(
        course_id=course_id,
        title=material.title,
        url=str(material.url),
        description=material.description
    )

    db.add(db_material)
    db.commit()
    db.refresh(db_material)

    return db_material


@router.delete("/materials/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()

    if material is None:
        raise HTTPException(status_code=404, detail="Material not found")

    require_manager(material.course, current_user)

    db.delete(material)
    db.commit()

    return {"message": "Material deleted"}


# -------------------------
# Assignments
# -------------------------

@router.get("/courses/{course_id}/assignments", response_model=list[schema.AssignmentResponse])
def get_assignments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(all_users)
):

    require_member(db, get_course(db, course_id), current_user)

    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.due_date)
        .all()
    )

    return [assignment_json(db, a, current_user) for a in assignments]


@router.post("/courses/{course_id}/assignments", response_model=schema.AssignmentResponse)
def create_assignment(
    course_id: int,
    assignment: schema.AssignmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    db_assignment = Assignment(course_id=course_id, **assignment.model_dump())

    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    return assignment_json(db, db_assignment, current_user)


@router.put("/assignments/{assignment_id}", response_model=schema.AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment: schema.AssignmentInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    db_assignment = get_assignment(db, assignment_id)

    require_manager(db_assignment.course, current_user)

    highest_score = max(
        (s.score for s in db_assignment.submissions if s.score is not None),
        default=0
    )

    if assignment.max_points < highest_score:
        raise HTTPException(
            status_code=400,
            detail=f"Max points cannot be below the highest score given ({highest_score})."
        )

    for key, value in assignment.model_dump().items():
        setattr(db_assignment, key, value)

    db.commit()
    db.refresh(db_assignment)

    return assignment_json(db, db_assignment, current_user)


@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    assignment = get_assignment(db, assignment_id)

    require_manager(assignment.course, current_user)

    db.delete(assignment)
    db.commit()

    return {"message": "Assignment deleted"}


@router.put("/assignments/{assignment_id}/submission", response_model=schema.SubmissionResponse)
def submit_assignment(
    assignment_id: int,
    submission: schema.SubmitAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):

    assignment = get_assignment(db, assignment_id)

    if not is_enrolled(db, assignment.course, current_user):
        raise HTTPException(status_code=403, detail="You are not part of this course")

    student = current_student(db, current_user)

    db_submission = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == student.id
    ).first()

    if db_submission and db_submission.score is not None:
        raise HTTPException(status_code=400, detail="This assignment has already been graded.")

    if db_submission is None:
        db_submission = Submission(assignment_id=assignment_id, student_id=student.id)
        db.add(db_submission)

    db_submission.content = submission.content
    db_submission.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_submission)

    return submission_json(db_submission)


@router.get("/assignments/{assignment_id}/submissions", response_model=list[schema.SubmissionResponse])
def get_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    assignment = get_assignment(db, assignment_id)

    require_manager(assignment.course, current_user)

    return [submission_json(s) for s in assignment.submissions]


@router.put("/submissions/{submission_id}/grade", response_model=schema.SubmissionResponse)
def grade_submission(
    submission_id: int,
    grade: schema.GradeSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    require_manager(submission.assignment.course, current_user)

    if grade.score > submission.assignment.max_points:
        raise HTTPException(
            status_code=400,
            detail=f"Score cannot be above {submission.assignment.max_points}."
        )

    submission.score = grade.score
    submission.feedback = grade.feedback
    submission.graded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(submission)

    return submission_json(submission)


# -------------------------
# Attendance
# -------------------------

@router.get("/courses/{course_id}/attendance", response_model=list[schema.AttendanceRow])
def get_attendance(
    course_id: int,
    on: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.course_id == course_id,
        AttendanceRecord.date == on
    ).all()

    statuses = {record.student_id: record.status for record in records}

    return [
        {
            "student_id": student.id,
            "student_name": student.name,
            "status": statuses.get(student.id),
        }
        for student in enrolled_students(db, course_id)
    ]


@router.post("/courses/{course_id}/attendance")
def save_attendance(
    course_id: int,
    attendance: schema.SaveAttendance,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    if attendance.date > date.today():
        raise HTTPException(status_code=400, detail="Attendance cannot be marked for a future date.")

    roster = {student.id for student in enrolled_students(db, course_id)}

    for entry in attendance.records:

        if entry.student_id not in roster:
            raise HTTPException(status_code=400, detail="Student is not enrolled in this course.")

        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.student_id == entry.student_id,
            AttendanceRecord.date == attendance.date
        ).first()

        if record is None:
            record = AttendanceRecord(
                course_id=course_id,
                student_id=entry.student_id,
                date=attendance.date
            )
            db.add(record)

        record.status = entry.status

    db.commit()

    return {"message": "Attendance saved"}


@router.get("/courses/{course_id}/attendance/me", response_model=schema.MyAttendance)
def get_my_attendance(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):

    student = current_student(db, current_user)

    require_member(db, get_course(db, course_id), current_user)

    records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.student_id == student.id
        )
        .order_by(AttendanceRecord.date.desc())
        .all()
    )

    return {
        "percent": attendance_percent(db, student.id, course_id),
        "records": records,
    }


# -------------------------
# Gradebook
# -------------------------

@router.get("/courses/{course_id}/gradebook", response_model=schema.Gradebook)
def get_gradebook(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(teacher_admin)
):

    require_manager(get_course(db, course_id), current_user)

    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.due_date)
        .all()
    )

    rows = []

    for student in enrolled_students(db, course_id):

        scores = {
            s.assignment_id: s.score
            for s in student.submissions
            if s.assignment.course_id == course_id
        }
        percent = course_percent(db, course_id, student.id)

        rows.append(
            {
                "student_id": student.id,
                "student_name": student.name,
                "cells": [
                    {"assignment_id": a.id, "score": scores.get(a.id)}
                    for a in assignments
                ],
                "percent": percent,
                "letter": letter_for(percent),
                "attendance_percent": attendance_percent(db, student.id, course_id),
            }
        )

    return {
        "assignments": [
            {"id": a.id, "title": a.title, "max_points": a.max_points}
            for a in assignments
        ],
        "rows": rows,
    }
