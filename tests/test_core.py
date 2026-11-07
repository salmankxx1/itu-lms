"""Regression tests for the bugs found in the project audit."""
from database import get_db
from models import Student, Teacher, User


def test_blank_teacher_is_accepted(api):
    response = api.client.post(
        "/students",
        headers=api.admin,
        json={"name": "No Teacher", "email": "n@test.com", "age": "20", "gender": "male", "teacher_id": ""},
    )
    assert response.status_code == 200
    assert response.json()["teacher_id"] is None
    assert response.json()["gender"] == "Male"


def test_students_search_filters(api):
    api.student()
    api.student(name="Omar", email="omar@test.com")
    response = api.client.get("/students", headers=api.admin, params={"search": "oma"})
    assert [s["name"] for s in response.json()["data"]] == ["Omar"]


def test_teachers_sort_is_applied(api):
    api.teacher("Abe", "abe@test.com")
    api.teacher("Tina", "tina@test.com")
    response = api.client.get("/teachers", headers=api.admin, params={"sort_by": "name", "order": "desc"})
    assert [t["name"] for t in response.json()["data"]] == ["Tina", "Abe"]


def test_sorting_by_teacher_and_bad_fields_never_crash(api):
    teacher = api.teacher()
    api.student(teacher_id=teacher["id"])
    api.course(teacher["id"])
    for path, field in [
        ("/students", "teacher"),
        ("/courses", "teacher"),
        ("/students", "metadata"),
        ("/courses", "hashed_password"),
        ("/teachers", "nonsense"),
    ]:
        assert api.client.get(path, headers=api.admin, params={"sort_by": field}).status_code == 200


def test_courses_survive_deleting_their_teacher(api):
    teacher = api.teacher()
    student = api.student(teacher_id=teacher["id"])
    api.course(teacher["id"])

    assert api.client.delete(f"/teachers/{teacher['id']}", headers=api.admin).status_code == 200

    response = api.client.get("/courses", headers=api.admin)
    assert response.status_code == 200
    assert response.json()["data"][0]["teacher"] is None
    assert api.client.get(f"/students/{student['id']}", headers=api.admin).json()["teacher"] is None


def test_duplicate_emails_are_rejected_cleanly(api):
    api.teacher()
    api.student()

    teacher_body = {"name": "D", "subject": "S", "department": "CS"}
    for email in ["tina@test.com", "sara@test.com", "SARA@test.com", "admin@test.com"]:
        response = api.client.post("/teachers", headers=api.admin, json={**teacher_body, "email": email})
        assert response.status_code == 400

    db = api.session_factory()
    assert db.query(Teacher).count() == 1


def test_update_cannot_take_another_email(api):
    first = api.student()
    other = api.student(name="Omar", email="omar@test.com")
    response = api.client.put(
        f"/students/{other['id']}",
        headers=api.admin,
        json={"name": "Omar", "email": first["email"], "age": 21, "gender": "Male"},
    )
    assert response.status_code == 400


def test_update_keeping_own_email_works(api):
    student = api.student()
    response = api.client.put(
        f"/students/{student['id']}",
        headers=api.admin,
        json={"name": "Sara K", "email": student["email"], "age": 21, "gender": "Female"},
    )
    assert response.status_code == 200


def test_invalid_input_is_rejected(api):
    assert api.client.post(
        "/teachers",
        headers=api.admin,
        json={"name": "Bad", "email": "not-an-email", "subject": "S", "department": "CS"},
    ).status_code == 422
    assert api.client.post(
        "/teachers",
        headers=api.admin,
        json={"name": " ", "email": "a@test.com", "subject": "S", "department": "CS"},
    ).status_code == 422
    assert api.client.post(
        "/courses",
        headers=api.admin,
        json={"name": "N", "code": "N", "credit_hours": -5},
    ).status_code == 422


def test_unknown_teacher_and_duplicate_code_give_400(api):
    assert api.client.post(
        "/courses",
        headers=api.admin,
        json={"name": "N", "code": "N", "credit_hours": 3, "teacher_id": 999},
    ).status_code == 400

    course = api.course()
    other = api.course(code="CS2")
    assert api.client.put(
        f"/courses/{other['id']}",
        headers=api.admin,
        json={"name": "N", "code": course["code"], "credit_hours": 3},
    ).status_code == 400


def test_first_login_must_change_password(api):
    api.student()
    headers = api.login("sara@test.com", api.generated["sara@test.com"])

    assert api.client.get("/me/overview", headers=headers).status_code == 403
    assert api.client.get("/me", headers=headers).json()["first_login"] is True

    api.activate("sara@test.com")
    fresh = api.login("sara@test.com", "new-password-1")
    assert api.client.get("/me/overview", headers=fresh).status_code == 200


def test_new_password_rules(api):
    api.student()
    current = api.generated["sara@test.com"]
    headers = api.login("sara@test.com", current)

    for new_password, expected in [("", 422), ("short", 422), (current, 400)]:
        response = api.client.post(
            "/change-password",
            headers=headers,
            json={"current_password": current, "new_password": new_password},
        )
        assert response.status_code == expected


def test_students_cannot_read_each_other(api):
    sara = api.student()
    omar = api.student(name="Omar", email="omar@test.com")
    headers = api.activate("sara@test.com")

    assert api.client.get(f"/students/{sara['id']}", headers=headers).status_code == 200
    assert api.client.get(f"/students/{omar['id']}", headers=headers).status_code == 403
    assert api.client.get("/students", headers=headers).status_code == 403
    assert api.client.get("/dashboard", headers=headers).status_code == 403


def test_teacher_only_sees_own_students(api):
    tina = api.teacher()
    abe = api.teacher("Abe", "abe@test.com")
    advisee = api.student(teacher_id=tina["id"])
    enrolled = api.student(name="Omar", email="omar@test.com")
    stranger = api.student(name="Zed", email="zed@test.com", teacher_id=abe["id"])
    course = api.course(tina["id"])
    api.enroll(course["id"], enrolled["id"])

    headers = api.activate("tina@test.com")

    response = api.client.get("/students", headers=headers)
    assert sorted(s["id"] for s in response.json()["data"]) == sorted([advisee["id"], enrolled["id"]])
    assert api.client.get(f"/students/{stranger['id']}", headers=headers).status_code == 403
    assert api.client.get(f"/students/{advisee['id']}", headers=headers).status_code == 200


def test_changing_email_keeps_session_and_login_in_sync(api):
    student = api.student()
    headers = api.activate("sara@test.com")

    response = api.client.put(
        f"/students/{student['id']}",
        headers=api.admin,
        json={"name": "Sara", "email": "sara2@test.com", "age": 20, "gender": "Female"},
    )
    assert response.status_code == 200
    assert api.client.get("/me", headers=headers).status_code == 200
    api.login("sara2@test.com", "new-password-1")


def test_reset_login_creates_missing_account(api):
    db = api.session_factory()
    db.add(Student(name="Old", email="old@test.com", age=20, gender="Male"))
    db.commit()
    student_id = db.query(Student).first().id

    listed = api.client.get("/students", headers=api.admin).json()["data"][0]
    assert listed["account_status"] == "none"

    response = api.client.post(f"/students/{student_id}/reset-login", headers=api.admin)
    assert response.status_code == 200
    api.login("old@test.com", response.json()["temporary_password"])

    listed = api.client.get("/students", headers=api.admin).json()["data"][0]
    assert listed["account_status"] == "pending"


def test_deleting_student_removes_login_and_coursework(api):
    teacher = api.teacher()
    student = api.student()
    course = api.course(teacher["id"])
    api.enroll(course["id"], student["id"])

    assert api.client.delete(f"/students/{student['id']}", headers=api.admin).status_code == 200

    db = api.session_factory()
    assert db.query(User).filter(User.email == "sara@test.com").first() is None
    assert api.client.get(f"/courses/{course['id']}/enrollments", headers=api.admin).json() == []


def test_dashboard_counts(api):
    api.teacher()
    api.student()
    body = api.client.get("/dashboard", headers=api.admin).json()
    assert body["students"] == 1
    assert body["teachers"] == 1
    assert body["studentsWithoutLogin"] == 0
    assert body["gender"] == [{"name": "Female", "value": 1}]


def test_crashes_stay_readable_by_the_browser(api):
    def broken_db():
        raise RuntimeError("database is down")

    api.client.app.dependency_overrides[get_db] = broken_db

    response = api.client.get(
        "/courses",
        headers={**api.admin, "Origin": "http://localhost:5173"},
    )

    assert response.status_code == 500
    assert "backend logs" in response.json()["detail"]
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_allows_same_wifi_devices_only(api):
    def preflight(origin):
        return api.client.options(
            "/login",
            headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
        ).status_code

    assert preflight("http://192.168.1.20:5173") == 200
    assert preflight("http://localhost:5173") == 200
    assert preflight("http://evil.example.com:5173") == 400


def test_health_needs_no_login(api):
    response = api.client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-content-type-options"] == "nosniff"


def test_repeated_failed_logins_are_locked_out(api):
    bad = {"email": "admin@test.com", "password": "wrong"}

    for _ in range(8):
        assert api.client.post("/login", json=bad).status_code == 401

    assert api.client.post("/login", json=bad).status_code == 429

    good = {"email": "admin@test.com", "password": "admin-password"}
    assert api.client.post("/login", json=good).status_code == 429
    assert api.client.post("/login", json={"email": "other@test.com", "password": "x"}).status_code == 401


def test_oversized_text_is_refused(api):
    too_long = {"name": "N" * 201, "email": "long@test.com", "age": 20, "gender": "Male"}
    assert api.client.post("/students", headers=api.admin, json=too_long).status_code == 422

    huge_login = {"email": "a@test.com", "password": "x" * 1000}
    assert api.client.post("/login", json=huge_login).status_code == 422

    course = api.course()
    assert api.client.post(
        "/announcements",
        headers=api.admin,
        json={"title": "t", "body": "b" * 10001, "course_id": course["id"]},
    ).status_code == 422
