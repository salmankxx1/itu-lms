import os
import secrets

from dotenv import load_dotenv

from database import SessionLocal
from models import User
from auth.hashing import hash_password

load_dotenv()

email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
password = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(12)

db = SessionLocal()

existing = db.query(User).filter(
    User.email == email
).first()

if existing:
    print("Admin already exists.")
else:
    admin = User(
        name="Admin",
        email=email,
        hashed_password=hash_password(password),
        role="admin"
    )

    db.add(admin)
    db.commit()

    print(f"Admin created: {email}")

    if not os.getenv("ADMIN_PASSWORD"):
        print(f"Temporary password: {password}")

db.close()
