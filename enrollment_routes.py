from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

import schema
from auth.role_checker import admin_only, student_only
from database import get_db
from lms_routes import current_student, enrolled_count, get_course
from models import Course, Enrollment, EnrollmentRequest, User

router = APIRouter()


def request_json(request):
    return {
        "id": request.id,
        "student_id": request.student_id,
        "student_name": request.student.name,
        "student_email": request.student.email,
        "course_id": request.course_id,
        "course_code": request.course.code,
        "course_name": request.course.name,
        "credit_hours": request.course.credit_hours,
        "status": request.status,
        "note": request.note,
        "created_at": request.created_at,
        "decided_at": request.decided_at,
    }


def get_request(db, request_id):
    request = db.query(EnrollmentRequest).filter(EnrollmentRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


def require_pending(request):
    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"This request was already {request.status}.")


def decide(request, status, admin, note=None):
    request.status = status
    request.note = note
    request.decided_at = datetime.now(timezone.utc)
    request.decided_by_id = admin.id


def approve_pending_request(db, student_id, course_id, admin):
    """Used when an admin enrolls a student directly, so the request is not left hanging."""
    request = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.student_id == student_id,
        EnrollmentRequest.course_id == course_id,
        EnrollmentRequest.status == "pending"
    ).first()

    if request:
        decide(request, "approved", admin)


# -------------------------
# Student side
# -------------------------

@router.get("/course-catalog", response_model=list[schema.CatalogCourse])
def get_course_catalog(
    search: str | None = Query(None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):

    student = current_student(db, current_user)

    enrolled_ids = {enrollment.course_id for enrollment in student.enrollments}
    requests = {request.course_id: request for request in student.enrollment_requests}

    query = db.query(Course)

    if search:
        query = query.filter(or_(Course.name.ilike(f"%{search}%"), Course.code.ilike(f"%{search}%")))

    catalog = []

    for course in query.order_by(Course.code).all():
        request = requests.get(course.id)

        if course.id in enrolled_ids:
            status = "enrolled"
        elif request and request.status in ("pending", "rejected"):
            status = request.status
        else:
            # Includes approved requests whose enrollment an admin later removed
            status = "available"

        catalog.append(
            {
                "id": course.id,
                "code": course.code,
                "name": course.name,
                "credit_hours": course.credit_hours,
                "description": course.description,
                "teacher_name": course.teacher.name if course.teacher else None,
                "enrolled_count": enrolled_count(db, course.id),
                "status": status,
                "request_id": request.id if status in ("pending", "rejected") else None,
                "note": request.note if status == "rejected" else None,
            }
        )

    return catalog


@router.post("/enrollment-requests", response_model=schema.EnrollmentRequestResponse)
def request_enrollment(
    body: schema.CreateEnrollmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):

    student = current_student(db, current_user)
    course = get_course(db, body.course_id)

    if any(enrollment.course_id == course.id for enrollment in student.enrollments):
        raise HTTPException(status_code=400, detail="You are already enrolled in this course.")

    request = db.query(EnrollmentRequest).filter(
        EnrollmentRequest.student_id == student.id,
        EnrollmentRequest.course_id == course.id
    ).first()

    if request and request.status == "pending":
        raise HTTPException(status_code=400, detail="You already requested this course.")

    if request is None:
        request = EnrollmentRequest(student_id=student.id, course_id=course.id)
        db.add(request)

    # A rejected or since-removed request can be sent again
    request.status = "pending"
    request.note = None
    request.decided_at = None
    request.decided_by_id = None
    request.created_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(request)

    return request_json(request)


@router.delete("/enrollment-requests/{request_id}")
def cancel_enrollment_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(student_only)
):

    student = current_student(db, current_user)
    request = get_request(db, request_id)

    # Another student's request looks the same as a missing one
    if request.student_id != student.id:
        raise HTTPException(status_code=404, detail="Request not found")

    require_pending(request)

    db.delete(request)
    db.commit()

    return {"message": "Request cancelled"}


# -------------------------
# Admin side
# -------------------------

@router.get("/enrollment-requests", response_model=list[schema.EnrollmentRequestResponse])
def list_enrollment_requests(
    status: schema.RequestStatus = Query("pending"),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    query = db.query(EnrollmentRequest).filter(EnrollmentRequest.status == status)

    if status == "pending":
        query = query.order_by(EnrollmentRequest.created_at, EnrollmentRequest.id)
    else:
        query = query.order_by(EnrollmentRequest.decided_at.desc(), EnrollmentRequest.id.desc())

    return [request_json(request) for request in query.limit(200).all()]


@router.post("/enrollment-requests/{request_id}/approve", response_model=schema.EnrollmentRequestResponse)
def approve_enrollment_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    request = get_request(db, request_id)
    require_pending(request)

    already_enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == request.student_id,
        Enrollment.course_id == request.course_id
    ).first()

    if already_enrolled is None:
        db.add(Enrollment(student_id=request.student_id, course_id=request.course_id))

    decide(request, "approved", current_user)

    db.commit()
    db.refresh(request)

    return request_json(request)


@router.post("/enrollment-requests/{request_id}/reject", response_model=schema.EnrollmentRequestResponse)
def reject_enrollment_request(
    request_id: int,
    body: schema.RejectEnrollmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):

    request = get_request(db, request_id)
    require_pending(request)

    decide(request, "rejected", current_user, body.note or None)

    db.commit()
    db.refresh(request)

    return request_json(request)
