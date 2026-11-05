"""One-time upgrade for a database created before the LMS features.

Run once:  python upgrade_existing_db.py
Back up first with pg_dump. A brand-new database only needs: alembic upgrade head
"""
import os
import sys

from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

load_dotenv()

NEW_TABLES = [
    "attendance_records",
    "submissions",
    "assignments",
    "course_materials",
    "announcements",
    "enrollments",
]

engine = create_engine(os.environ["DATABASE_URL"])
inspector = inspect(engine)

if "user_id" in [column["name"] for column in inspector.get_columns("students")]:
    sys.exit("This database is already upgraded. Nothing to do.")

existing = [table for table in NEW_TABLES if inspector.has_table(table)]

with engine.begin() as connection:

    # An older startup could create these early and empty. Refuse to touch real data.
    for table in existing:
        rows = connection.execute(text(f"SELECT count(*) FROM {table}")).scalar()
        if rows:
            sys.exit(f"Stopped: {table} has {rows} rows. Nothing was changed.")

    for table in existing:
        connection.execute(text(f"DROP TABLE {table}"))

config = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini"))
command.stamp(config, "0001_baseline", purge=True)
command.upgrade(config, "head")

with engine.connect() as connection:
    for table in ["users", "students", "teachers", "courses"]:
        rows = connection.execute(text(f"SELECT count(*) FROM {table}")).scalar()
        print(f"{table}: {rows} rows")

print("Upgrade complete.")
