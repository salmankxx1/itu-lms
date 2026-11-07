"""Students request courses; an admin approves or rejects them."""
import pytest


@pytest.fixture
def school(api):
    teacher = api.teacher()
    student = api.student()
    other = api.student(name="Omar", email="omar@test.com")
    course = api.course(teacher["id"])
    return {
        "course": course,
        "student": student,
        "other": other,
        "student_headers": api.activate("sara@test.com"),
        "other_headers": api.activate("omar@test.com"),
        "teacher_headers": api.activate("tina@test.com"),
    }


def catalog_entry(api, headers, course_id):
    catalog = api.client.get("/course-catalog", headers=headers).json()
    return next(course for course in catalog if course["id"] == course_id)


def request(api, headers, course_id):
    return api.client.post("/enrollment-requests", headers=headers, json={"course_id": course_id})


def test_request_then_approve_enrolls_the_student(api, school):
    course_id = school["course"]["id"]
    headers = school["student_headers"]

    assert catalog_entry(api, headers, course_id)["status"] == "available"

    created = request(api, headers, course_id)
    assert created.status_code == 200
    assert created.json()["status"] == "pending"
    assert catalog_entry(api, headers, course_id)["status"] == "pending"

    # Waiting is not the same as enrolled
    assert api.client.get(f"/courses/{course_id}/materials", headers=headers).status_code == 403
    assert api.client.get("/dashboard", headers=api.admin).json()["pendingRequests"] == 1

    waiting = api.client.get("/enrollment-requests", headers=api.admin).json()
    assert [r["student_name"] for r in waiting] == ["Sara"]

    approved = api.client.post(f"/enrollment-requests/{waiting[0]['id']}/approve", headers=api.admin)
    assert approved.status_code == 200

    assert catalog_entry(api, headers, course_id)["status"] == "enrolled"
    assert api.client.get(f"/courses/{course_id}/materials", headers=headers).status_code == 200
    assert api.client.get("/me/overview", headers=headers).json()["courses"][0]["id"] == course_id
    assert api.client.get("/enrollment-requests", headers=api.admin).json() == []
    assert len(api.client.get("/enrollment-requests", headers=api.admin, params={"status": "approved"}).json()) == 1

    again = api.client.post(f"/enrollment-requests/{waiting[0]['id']}/approve", headers=api.admin)
    assert again.status_code == 400


def test_rejection_reason_is_shown_and_student_can_ask_again(api, school):
    course_id = school["course"]["id"]
    headers = school["student_headers"]

    request_id = request(api, headers, course_id).json()["id"]
    rejected = api.client.post(
        f"/enrollment-requests/{request_id}/reject",
        headers=api.admin,
        json={"note": "Prerequisite missing"},
    )
    assert rejected.status_code == 200

    entry = catalog_entry(api, headers, course_id)
    assert entry["status"] == "rejected"
    assert entry["note"] == "Prerequisite missing"

    assert request(api, headers, course_id).status_code == 200
    entry = catalog_entry(api, headers, course_id)
    assert entry["status"] == "pending"
    assert entry["note"] is None


def test_duplicates_are_refused(api, school):
    course_id = school["course"]["id"]
    headers = school["student_headers"]

    assert request(api, headers, course_id).status_code == 200
    assert request(api, headers, course_id).status_code == 400

    api.enroll(course_id, school["other"]["id"])
    assert request(api, school["other_headers"], course_id).status_code == 400

    assert request(api, headers, 99999).status_code == 404


def test_student_can_cancel_only_their_own_waiting_request(api, school):
    course_id = school["course"]["id"]
    mine = request(api, school["student_headers"], course_id).json()

    assert api.client.delete(f"/enrollment-requests/{mine['id']}", headers=school["other_headers"]).status_code == 404
    assert api.client.delete(f"/enrollment-requests/{mine['id']}", headers=school["student_headers"]).status_code == 200
    assert catalog_entry(api, school["student_headers"], course_id)["status"] == "available"

    decided = request(api, school["student_headers"], course_id).json()
    api.client.post(f"/enrollment-requests/{decided['id']}/approve", headers=api.admin)
    assert api.client.delete(f"/enrollment-requests/{decided['id']}", headers=school["student_headers"]).status_code == 400


def test_only_the_right_roles_can_act(api, school):
    course_id = school["course"]["id"]
    request_id = request(api, school["student_headers"], course_id).json()["id"]

    for headers in (school["student_headers"], school["teacher_headers"]):
        assert api.client.get("/enrollment-requests", headers=headers).status_code == 403
        assert api.client.post(f"/enrollment-requests/{request_id}/approve", headers=headers).status_code == 403
        assert api.client.post(f"/enrollment-requests/{request_id}/reject", headers=headers, json={}).status_code == 403

    assert request(api, api.admin, course_id).status_code == 403
    assert request(api, school["teacher_headers"], course_id).status_code == 403
    assert api.client.get("/course-catalog", headers=school["teacher_headers"]).status_code == 403


def test_direct_enrollment_settles_a_waiting_request(api, school):
    course_id = school["course"]["id"]
    request(api, school["student_headers"], course_id)

    api.enroll(course_id, school["student"]["id"])

    assert api.client.get("/enrollment-requests", headers=api.admin).json() == []
    assert catalog_entry(api, school["student_headers"], course_id)["status"] == "enrolled"


def test_removed_student_can_request_again(api, school):
    course_id = school["course"]["id"]
    request_id = request(api, school["student_headers"], course_id).json()["id"]
    api.client.post(f"/enrollment-requests/{request_id}/approve", headers=api.admin)

    api.client.delete(f"/courses/{course_id}/enrollments/{school['student']['id']}", headers=api.admin)

    assert catalog_entry(api, school["student_headers"], course_id)["status"] == "available"
    assert request(api, school["student_headers"], course_id).status_code == 200


def test_requests_go_away_with_the_course_or_student(api, school):
    course_id = school["course"]["id"]
    request(api, school["student_headers"], course_id)
    request(api, school["other_headers"], course_id)

    api.client.delete(f"/students/{school['other']['id']}", headers=api.admin)
    assert len(api.client.get("/enrollment-requests", headers=api.admin).json()) == 1

    api.client.delete(f"/courses/{course_id}", headers=api.admin)
    assert api.client.get("/enrollment-requests", headers=api.admin).json() == []


def test_rejection_note_length_is_limited(api, school):
    request_id = request(api, school["student_headers"], school["course"]["id"]).json()["id"]
    response = api.client.post(
        f"/enrollment-requests/{request_id}/reject",
        headers=api.admin,
        json={"note": "x" * 501},
    )
    assert response.status_code == 422
