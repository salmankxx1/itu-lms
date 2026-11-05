import os
import sys
from pathlib import Path

# Must be set before the app is imported. dotenv never overrides these, so
# tests cannot reach the real database or send real email.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["SMTP_USERNAME"] = ""
os.environ["BREVO_API_KEY"] = ""
os.environ["ENVIRONMENT"] = "development"
os.environ["SMTP_PASSWORD"] = ""

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main
from auth.hashing import hash_password
from auth.login_limiter import login_limiter
from database import Base, get_db
from models import User


class Api:
    """Test client plus helpers for the accounts each test needs."""

    def __init__(self, client, session_factory, generated):
        self.client = client
        self.session_factory = session_factory
        self.generated = generated
        self.admin = self.login("admin@test.com", "admin-password")

    def login(self, email, password):
        response = self.client.post("/login", json={"email": email, "password": password})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    def activate(self, email):
        """Logs in with the emailed password and completes the forced change."""
        headers = self.login(email, self.generated[email])
        response = self.client.post(
            "/change-password",
            headers=headers,
            json={"current_password": self.generated[email], "new_password": "new-password-1"},
        )
        assert response.status_code == 200, response.text
        return headers

    def teacher(self, name="Tina", email="tina@test.com"):
        response = self.client.post(
            "/teachers",
            headers=self.admin,
            json={"name": name, "email": email, "subject": "AI", "department": "CS"},
        )
        assert response.status_code == 200, response.text
        return response.json()

    def student(self, name="Sara", email="sara@test.com", teacher_id=None):
        response = self.client.post(
            "/students",
            headers=self.admin,
            json={"name": name, "email": email, "age": 20, "gender": "Female", "teacher_id": teacher_id},
        )
        assert response.status_code == 200, response.text
        return response.json()

    def course(self, teacher_id=None, code="CS1"):
        response = self.client.post(
            "/courses",
            headers=self.admin,
            json={"name": "AI", "code": code, "credit_hours": 3, "teacher_id": teacher_id},
        )
        assert response.status_code == 200, response.text
        return response.json()

    def enroll(self, course_id, student_id):
        response = self.client.post(
            f"/courses/{course_id}/enrollments",
            headers=self.admin,
            json={"student_id": student_id},
        )
        assert response.status_code == 200, response.text


@pytest.fixture
def api(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False)

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[get_db] = override_get_db
    login_limiter.clear()

    generated = {}

    def fake_send(name, email, password, role):
        generated[email] = password
        return True

    monkeypatch.setattr(main.email_service, "send_welcome_email", fake_send)

    db = session_factory()
    db.add(User(
        name="Admin",
        email="admin@test.com",
        hashed_password=hash_password("admin-password"),
        role="admin",
        first_login=False,
    ))
    db.commit()
    db.close()

    client = TestClient(main.app, raise_server_exceptions=False)
    yield Api(client, session_factory, generated)

    main.app.dependency_overrides.clear()
