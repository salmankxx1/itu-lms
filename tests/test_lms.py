"""End-to-end coverage of the course space: the path a real class follows."""
from datetime import date, datetime, timedelta, timezone

import pytest


@pytest.fixture
def classroom(api):
    teacher = api.teacher()
    api.teacher("Abe", "abe@test.com")
    student = api.student()
    outsider = api.student(name="Omar", email="omar@test.com")
    course = api.course(teacher["id"])
    api.enroll(course["id"], student["id"])
    return {
        "course": course,
        "student": student,
        "outsider": outsider,
        "teacher_headers": api.activate("tina@test.com"),
        "other_teacher_headers": api.activate("abe@test.com"),
        "student_headers": api.activate("sara@test.com"),
        "outsider_headers": api.activate("omar@test.com"),
    }


def due(days=7):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def make_assignment(api, classroom, days=7, max_points=100):
    response = api.client.post(
        f"/courses/{classroom['course']['id']}/assignments",
        headers=classroom["teacher_headers"],
        json={"title": "HW1", "due_date": due(days), "max_points": max_points},
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_enrollment_rules(api, classroom):
    course_id = classroom["course"]["id"]
    student_id = classroom["student"]["id"]

    duplicate = api.client.post(
        f"/courses/{course_id}/enrollments", headers=api.admin, json={"student_id": student_id}
    )
    assert duplicate.status_code == 400

    teacher_try = api.client.post(
        f"/courses/{course_id}/enrollments",
        headers=classroom["teacher_headers"],
        json={"student_id": classroom["outsider"]["id"]},
    )
    assert teacher_try.status_code == 403

    assert api.client.delete(
        f"/courses/{course_id}/enrollments/{student_id}", headers=api.admin
    ).status_code == 200


def test_course_content_is_members_only(api, classroom):
    course_id = classroom["course"]["id"]
    for path in ("materials", "assignments"):
        url = f"/courses/{course_id}/{path}"
        assert api.client.get(url, headers=classroom["student_headers"]).status_code == 200
        assert api.client.get(url, headers=classroom["outsider_headers"]).status_code == 403


def test_only_the_course_teacher_can_manage(api, classroom):
    course_id = classroom["course"]["id"]
    for headers in (classroom["other_teacher_headers"], classroom["student_headers"]):
        response = api.client.post(
            f"/courses/{course_id}/assignments",
            headers=headers,
            json={"title": "X", "due_date": due(), "max_points": 10},
        )
        assert response.status_code == 403


def test_announcement_visibility(api, classroom):
    course_id = classroom["course"]["id"]

    assert api.client.post(
        "/announcements", headers=api.admin, json={"title": "Campus", "body": "Closed Friday"}
    ).status_code == 200
    assert api.client.post(
        "/announcements",
        headers=classroom["teacher_headers"],
        json={"title": "Quiz", "body": "Monday", "course_id": course_id},
    ).status_code == 200
    assert api.client.post(
        "/announcements", headers=classroom["teacher_headers"], json={"title": "No", "body": "No"}
    ).status_code == 403

    enrolled = api.client.get("/announcements", headers=classroom["student_headers"]).json()
    assert {a["title"] for a in enrolled} == {"Campus", "Quiz"}

    outsider = api.client.get("/announcements", headers=classroom["outsider_headers"]).json()
    assert {a["title"] for a in outsider} == {"Campus"}


def test_materials_only_accept_web_links(api, classroom):
    url = f"/courses/{classroom['course']['id']}/materials"
    headers = classroom["teacher_headers"]

    assert api.client.post(
        url, headers=headers, json={"title": "Bad", "url": "javascript:alert(1)"}
    ).status_code == 422

    assert api.client.post(
        url, headers=headers, json={"title": "Slides", "url": "https://example.com/slides.pdf"}
    ).status_code == 200


def test_submit_grade_and_report(api, classroom):
    assignment = make_assignment(api, classroom)
    url = f"/assignments/{assignment['id']}/submission"

    assert api.client.put(
        url, headers=classroom["outsider_headers"], json={"content": "x"}
    ).status_code == 403

    submission = api.client.put(url, headers=classroom["student_headers"], json={"content": "first"}).json()
    assert submission["is_late"] is False

    resubmitted = api.client.put(url, headers=classroom["student_headers"], json={"content": "second"}).json()
    assert resubmitted["id"] == submission["id"]
    assert resubmitted["content"] == "second"

    grade_url = f"/submissions/{submission['id']}/grade"
    assert api.client.put(
        grade_url, headers=classroom["teacher_headers"], json={"score": 101}
    ).status_code == 400
    assert api.client.put(
        grade_url, headers=classroom["other_teacher_headers"], json={"score": 90}
    ).status_code == 403
    assert api.client.put(
        grade_url, headers=classroom["teacher_headers"], json={"score": 90, "feedback": "Good"}
    ).status_code == 200

    assert api.client.put(url, headers=classroom["student_headers"], json={"content": "late edit"}).status_code == 400

    grades = api.client.get("/me/grades", headers=classroom["student_headers"]).json()
    assert grades["courses"][0]["percent"] == 90.0
    assert grades["courses"][0]["letter"] == "A"
    assert grades["gpa"] == 4.0

    mine = api.client.get(
        f"/courses/{classroom['course']['id']}/assignments", headers=classroom["student_headers"]
    ).json()[0]
    assert mine["my_submission"]["feedback"] == "Good"
    assert mine["submission_count"] is None

    gradebook = api.client.get(
        f"/courses/{classroom['course']['id']}/gradebook", headers=classroom["teacher_headers"]
    ).json()
    assert gradebook["rows"][0]["cells"][0]["score"] == 90
    assert gradebook["rows"][0]["letter"] == "A"


def test_ungraded_work_does_not_lower_a_grade(api, classroom):
    make_assignment(api, classroom)
    first = make_assignment(api, classroom)
    submission = api.client.put(
        f"/assignments/{first['id']}/submission",
        headers=classroom["student_headers"],
        json={"content": "done"},
    ).json()
    api.client.put(
        f"/submissions/{submission['id']}/grade",
        headers=classroom["teacher_headers"],
        json={"score": 50},
    )
    grades = api.client.get("/me/grades", headers=classroom["student_headers"]).json()
    assert grades["courses"][0]["percent"] == 50.0


def test_late_submission_is_flagged(api, classroom):
    assignment = make_assignment(api, classroom, days=-1)
    submission = api.client.put(
        f"/assignments/{assignment['id']}/submission",
        headers=classroom["student_headers"],
        json={"content": "sorry"},
    ).json()
    assert submission["is_late"] is True


def test_max_points_cannot_drop_below_given_score(api, classroom):
    assignment = make_assignment(api, classroom)
    submission = api.client.put(
        f"/assignments/{assignment['id']}/submission",
        headers=classroom["student_headers"],
        json={"content": "x"},
    ).json()
    api.client.put(
        f"/submissions/{submission['id']}/grade",
        headers=classroom["teacher_headers"],
        json={"score": 90},
    )
    response = api.client.put(
        f"/assignments/{assignment['id']}",
        headers=classroom["teacher_headers"],
        json={"title": "HW1", "due_date": due(), "max_points": 50},
    )
    assert response.status_code == 400


def test_attendance_flow(api, classroom):
    course_id = classroom["course"]["id"]
    student_id = classroom["student"]["id"]
    url = f"/courses/{course_id}/attendance"
    today = date.today()
    headers = classroom["teacher_headers"]

    roster = api.client.get(url, headers=headers, params={"on": today.isoformat()}).json()
    assert roster == [{"student_id": student_id, "student_name": "Sara", "status": None}]

    def save(day, status, target=student_id):
        return api.client.post(
            url,
            headers=headers,
            json={"date": day.isoformat(), "records": [{"student_id": target, "status": status}]},
        )

    assert save(today, "present").status_code == 200
    assert save(today - timedelta(days=1), "absent").status_code == 200
    assert save(today, "late").status_code == 200  # same day updates, never duplicates
    assert save(today + timedelta(days=1), "present").status_code == 400
    assert save(today, "present", classroom["outsider"]["id"]).status_code == 400

    mine = api.client.get(f"{url}/me", headers=classroom["student_headers"]).json()
    assert mine["percent"] == 50.0
    assert len(mine["records"]) == 2


def test_overviews_use_real_data(api, classroom):
    assignment = make_assignment(api, classroom)

    student = api.client.get("/me/overview", headers=classroom["student_headers"]).json()
    assert student["name"] == "Sara"
    assert student["courses"][0]["code"] == "CS1"
    assert student["upcoming"][0]["id"] == assignment["id"]
    assert student["upcoming"][0]["submitted"] is False

    api.client.put(
        f"/assignments/{assignment['id']}/submission",
        headers=classroom["student_headers"],
        json={"content": "x"},
    )

    teacher = api.client.get("/me/overview", headers=classroom["teacher_headers"]).json()
    assert teacher["name"] == "Tina"
    assert teacher["students_total"] == 1
    assert teacher["pending_grading"] == 1


def test_deleting_course_removes_its_content(api, classroom):
    assignment = make_assignment(api, classroom)
    course_id = classroom["course"]["id"]
    api.client.put(
        f"/assignments/{assignment['id']}/submission",
        headers=classroom["student_headers"],
        json={"content": "x"},
    )
    assert api.client.delete(f"/courses/{course_id}", headers=api.admin).status_code == 200
    assert api.client.get(f"/courses/{course_id}", headers=api.admin).status_code == 404
