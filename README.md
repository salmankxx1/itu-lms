# ITU LMS

A learning management system for Information Technology University, Lahore, with separate portals for admins, teachers and students.

**Stack:** FastAPI, SQLAlchemy, PostgreSQL, Alembic, React 19, Vite, Material UI 9.

## Features

| Area | What it does |
| --- | --- |
| Accounts | JWT login, three roles, forced password change on first login, emailed credentials |
| Admin | Manage students, teachers and courses; enroll students; create or reset logins; analytics dashboard |
| Course space | Announcements, materials, assignments, attendance, people and gradebook for each course |
| Teachers | Post content, review and grade submissions with feedback, mark attendance, export the gradebook to CSV |
| Students | See courses, deadlines and announcements; submit work; see grades, GPA and attendance; download a grade report |
| Public site | Programs, fees, tuition calculator, campus and faculty pages |

The interface adapts to phones, tablets and desktops, and has light and dark themes.

## Setup

You need Python 3.13, Node.js and PostgreSQL.

1. Create an empty PostgreSQL database.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `SECRET_KEY`. Add a Brevo API key or the Gmail App Password settings to send real email. Without them, no email is sent.
3. Set up the backend:

   ```
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head
   python seed_admin.py
   uvicorn main:app --reload
   ```

4. In a second terminal, start the frontend:

   ```
   cd frontend
   npm install
   npm run dev
   ```

5. Open http://localhost:5173. The API docs are at http://127.0.0.1:8000/docs.

`seed_admin.py` prints a temporary admin password unless `ADMIN_PASSWORD` is set.

To open the site on a phone on the same Wi-Fi, start the frontend with `npm run dev -- --host`, start `uvicorn` with `--host 0.0.0.0`, and browse to your PC's IP address on port 5173.

## Deployment

The production setup uses Render, Neon and Brevo. See [DEPLOYMENT.md](DEPLOYMENT.md).

### Upgrading a database from before the LMS features

Back up the database, then run this once instead of `alembic upgrade head`:

```
python upgrade_existing_db.py
```

## Using it

1. Sign in as admin and add teachers, courses and students. New accounts get a temporary password by email.
2. Open a course from **Courses** and enroll students on the **People** tab.
3. Older records show a **No login** badge. Click it to create a login. The temporary password appears once on screen and is also emailed.

Grades use graded work only, so an unmarked assignment never lowers a score. Scale: A 85, A- 80, B+ 75, B 71, B- 68, C+ 64, C 61, C- 58, D+ 54, D 50, below that F.

## Tests

```
pip install -r requirements-dev.txt
python -m pytest tests
cd frontend
npm run lint
```

The tests use an in-memory SQLite database and never touch PostgreSQL or send email.

## Project layout

```
main.py              Auth, dashboard, and student, teacher and course management
lms_routes.py        Course space: enrollment, content, assignments, attendance, grades
models.py, schema.py Database tables and API request and response shapes
auth/                Password hashing, JWT and role checks
email_service.py     Welcome emails through the Brevo API or SMTP
alembic/             Database migrations
tests/               Backend tests
frontend/src/
  pages/             One file per screen
  components/        Tables, forms, dialogs and the course tabs
  services/          API client, data-loading hooks and formatting
```

## Image credit

Campus rendering and lab photos are from [itu.edu.pk](https://itu.edu.pk). The building image is an architect's rendering, not a photograph.
