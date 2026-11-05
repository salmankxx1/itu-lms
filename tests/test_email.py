import httpx

import email_service


def test_welcome_email_never_logs_the_password(caplog):
    # conftest clears the SMTP settings, so this renders the email without sending it
    with caplog.at_level("WARNING", logger="uvicorn.error"):
        sent = email_service.send_welcome_email(
            name="<b>Sara</b>",
            email="sara@test.com",
            password="very-secret-password",
            role="teacher",
        )

    assert sent is False
    assert "very-secret-password" not in caplog.text
    assert "sara@test.com" in caplog.text


def test_generated_passwords_are_strong_and_unique():
    passwords = {email_service.generate_secure_password(10) for _ in range(50)}

    assert len(passwords) == 50
    assert all(len(password) == 10 for password in passwords)


def test_admin_is_told_when_email_was_sent(api):
    student = api.student()

    assert student["email_sent"] is True
    assert student["temporary_password"] is None


def test_admin_gets_the_password_when_email_fails(api, monkeypatch):
    monkeypatch.setattr(email_service, "send_welcome_email", lambda **kwargs: False)

    student = api.student()

    assert student["email_sent"] is False
    api.login("sara@test.com", student["temporary_password"])

    teacher = api.teacher()

    assert teacher["email_sent"] is False
    api.login("tina@test.com", teacher["temporary_password"])

    reset = api.client.post(f"/students/{student['id']}/reset-login", headers=api.admin).json()

    assert reset["email_sent"] is False
    assert reset["temporary_password"]


def test_brevo_is_used_when_configured(monkeypatch):
    calls = []

    def fake_post(url, headers, json, timeout):
        calls.append((url, headers, json))
        return httpx.Response(201, json={"messageId": "1"})

    monkeypatch.setattr(email_service, "BREVO_API_KEY", "test-key")
    monkeypatch.setattr(email_service, "SENDER_EMAIL", "lms@test.com")
    monkeypatch.setattr(email_service.httpx, "post", fake_post)

    assert email_service.send_welcome_email("Sara", "sara@test.com", "pw-1234567", "student") is True

    url, headers, body = calls[0]
    assert url == email_service.BREVO_URL
    assert headers["api-key"] == "test-key"
    assert body["sender"]["email"] == "lms@test.com"
    assert body["to"] == [{"email": "sara@test.com", "name": "Sara"}]
    assert "pw-1234567" in body["htmlContent"]


def test_brevo_rejection_is_reported_as_failure(monkeypatch):
    monkeypatch.setattr(email_service, "BREVO_API_KEY", "test-key")
    monkeypatch.setattr(
        email_service.httpx,
        "post",
        lambda *args, **kwargs: httpx.Response(401, json={"message": "unauthorized"}),
    )

    assert email_service.send_welcome_email("Sara", "sara@test.com", "pw-1234567", "student") is False
