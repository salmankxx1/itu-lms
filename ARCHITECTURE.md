# ITU LMS: Architecture and Data Flow

This document shows how the ITU Learning Management System is put together: the parts of the system, how data moves between them, what each role can do, and how the code is organised. Each diagram is written in Mermaid, so it renders directly on GitHub and in VS Code.

**Live site:** https://itu-lms-web.onrender.com
**API:** https://itu-lms-api.onrender.com

---

## 1. System overview

The browser loads a React single-page app. Every piece of data comes from a FastAPI backend, which reads and writes a PostgreSQL database and sends account emails through Brevo.

```mermaid
flowchart LR
    subgraph Users["Users"]
        A["Admin"]
        T["Teacher"]
        S["Student"]
    end

    subgraph Web["Frontend: React + Vite + MUI<br/>Render static site"]
        UI["Pages and components"]
        AX["Axios client<br/>adds JWT to every request"]
    end

    subgraph Api["Backend: FastAPI<br/>Render web service"]
        MW["Middleware<br/>CORS, security headers,<br/>error handler"]
        AUTH["Auth<br/>JWT, bcrypt, role checks,<br/>login rate limit"]
        ROUTES["Routes<br/>main, lms_routes,<br/>enrollment_routes"]
        ORM["SQLAlchemy models"]
        MAIL["Email service"]
    end

    DB[("PostgreSQL<br/>Neon")]
    BREVO["Brevo email API"]
    INBOX["User's inbox"]

    A & T & S --> UI
    UI --> AX
    AX -- "HTTPS + JSON" --> MW
    MW --> AUTH --> ROUTES
    ROUTES --> ORM --> DB
    ROUTES --> MAIL --> BREVO --> INBOX
```

---

## 2. How one request flows

This example follows a student opening their portal. Every protected page works the same way: the token is checked, the role is checked, and only then is the database queried.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as React page
    participant API as FastAPI
    participant Auth as Auth layer
    participant DB as PostgreSQL

    Student->>UI: Opens the portal
    UI->>API: GET /me/overview<br/>Authorization: Bearer token
    API->>Auth: Decode JWT and load the user
    alt Token missing, expired or invalid
        Auth-->>UI: 401 Unauthorized
        UI-->>Student: Sent back to the login page
    else First login not finished
        Auth-->>UI: 403 Change password first
        UI-->>Student: Sent to Change Password
    else Wrong role for this route
        Auth-->>UI: 403 Forbidden
    else Allowed
        Auth->>API: Current user
        API->>DB: Courses, grades, attendance, deadlines
        DB-->>API: Rows
        API-->>UI: 200 JSON
        UI-->>Student: Portal with GPA, courses and deadlines
    end
```

---

## 3. Account and login flow

The admin creates every account. A temporary password is emailed to the person, and they must replace it the first time they sign in.

```mermaid
flowchart TD
    A["Admin adds a teacher or student"] --> B["Backend creates the user<br/>with a random temporary password"]
    B --> C{"Email sent through Brevo?"}
    C -- Yes --> D["Person receives the login link<br/>and temporary password"]
    C -- No --> E["Admin sees the temporary password once<br/>and shares it in person"]
    D --> F["Person signs in"]
    E --> F
    F --> G{"Correct password?"}
    G -- No --> H["Failed attempt counted<br/>locked for a few minutes after too many"]
    H --> F
    G -- Yes --> I{"First login?"}
    I -- Yes --> J["Must set a new password"]
    J --> K["Role-based home page"]
    I -- No --> K
    K --> L["Admin: Dashboard"]
    K --> M["Teacher: Faculty Hub"]
    K --> N["Student: Student Portal"]
```

---

## 4. Course request and approval flow

Students choose the courses they want, and an admin approves or rejects each request. A student only gets access to a course's content after approval.

```mermaid
stateDiagram-v2
    [*] --> Available: Course exists
    Available --> Pending: Student clicks Request to join
    Pending --> Available: Student cancels
    Pending --> Approved: Admin approves
    Pending --> Rejected: Admin rejects, with an optional reason
    Rejected --> Pending: Student requests again
    Available --> Approved: Admin enrolls the student directly
    Approved --> [*]: Student is enrolled and can open the course
```

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    actor A as Admin
    participant API as FastAPI
    participant DB as PostgreSQL

    S->>API: GET /course-catalog
    API-->>S: Courses with status: available, pending, rejected or enrolled
    S->>API: POST /enrollment-requests {course_id}
    API->>DB: Save request as pending
    A->>API: GET /dashboard
    API-->>A: pendingRequests count, shown as an alert
    A->>API: GET /enrollment-requests?status=pending
    alt Approve
        A->>API: POST /enrollment-requests/{id}/approve
        API->>DB: Mark approved and create the enrollment
        S->>API: GET /course-catalog
        API-->>S: Enrolled, with an Open course button
    else Reject
        A->>API: POST /enrollment-requests/{id}/reject {note}
        API->>DB: Mark rejected and store the reason
        S->>API: GET /course-catalog
        API-->>S: Not approved, with the reason and Request again
    end
```

---

## 5. Coursework flow

This is the teaching cycle inside a course, from posting an assignment to the student's GPA.

```mermaid
flowchart LR
    T1["Teacher posts an assignment<br/>title, due date, max points"] --> S1["Student sees it under<br/>Upcoming Deadlines"]
    S1 --> S2["Student submits text or a link"]
    S2 --> T2["Teacher opens Submissions<br/>and enters a score and feedback"]
    T2 --> G1["Gradebook updates<br/>total, percent, letter grade"]
    T3["Teacher takes attendance<br/>present, late, absent"] --> G1
    G1 --> S3["Student sees My Grades<br/>and GPA, can export CSV"]
    T4["Teacher shares materials<br/>and announcements"] --> S4["Student reads them<br/>in the course space"]
```

---

## 6. Features by role

```mermaid
mindmap
  root((ITU LMS))
    Admin
      Dashboard with campus statistics
      Manage students
      Manage teachers
      Manage courses
      Create or reset logins
      Approve or reject course requests
      Enroll students directly
      Post announcements
    Teacher
      Faculty Hub
      My Students and advisees
      My Courses
      Assignments and grading
      Course materials
      Attendance
      Gradebook with CSV export
      Course announcements
    Student
      Student Portal with GPA
      Browse Courses and request to join
      Course space
      Submit assignments
      My Grades with CSV export
      Own attendance record
      Announcements
    Everyone
      Secure login with password toggle
      Forced password change on first login
      Light and dark mode
      Works on phone, tablet and desktop
```

---

## 7. Modules

### Backend

```mermaid
flowchart TD
    MAIN["main.py<br/>app setup, middleware, login,<br/>students, teachers, courses, dashboard"]
    LMS["lms_routes.py<br/>course space, assignments, submissions,<br/>materials, attendance, gradebook, /me"]
    ENR["enrollment_routes.py<br/>course catalog and enrollment requests"]
    SCHEMA["schema.py<br/>Pydantic request and response models"]
    MODELS["models.py<br/>SQLAlchemy tables"]
    DBPY["database.py<br/>engine and session"]
    EMAIL["email_service.py<br/>Brevo API, SMTP fallback"]

    subgraph AUTHPKG["auth/"]
        HASH["hashing.py<br/>bcrypt"]
        JWT["jwt_handler.py<br/>create and verify tokens"]
        OAUTH["oauth2.py<br/>current user"]
        ROLE["role_checker.py<br/>admin_only, teacher_admin,<br/>student_only, all_users"]
        LIMIT["login_limiter.py<br/>failed-login lockout"]
    end

    ALEMBIC["alembic/<br/>database migrations"]
    TESTS["tests/<br/>pytest suite"]

    MAIN --> LMS
    MAIN --> ENR
    LMS -. "settles pending requests" .-> ENR
    MAIN & LMS & ENR --> SCHEMA
    MAIN & LMS & ENR --> MODELS
    MAIN & LMS & ENR --> AUTHPKG
    MAIN --> EMAIL
    MODELS --> DBPY
    ALEMBIC --> MODELS
    TESTS --> MAIN
```

### Frontend

```mermaid
flowchart TD
    APP["App.jsx<br/>routes, lazy loading, theme"]
    PR["ProtectedRoute<br/>login, role and first-login checks"]
    LAYOUT["Layout + Navbar"]
    RD["RoleDispatcher<br/>picks the home page by role"]

    subgraph Public["Public pages"]
        HOME["PublicHome"]
        LOGIN["Login"]
        CP["ChangePassword"]
    end

    subgraph AdminPages["Admin"]
        DASH["Dashboard"]
        STU["Students"]
        TEA["Teachers"]
        CRS["Courses"]
        REQ["EnrollmentRequests"]
    end

    subgraph TeacherPages["Teacher"]
        TP["TeacherPortal"]
        MYS["Students: My Students"]
    end

    subgraph StudentPages["Student"]
        SP["StudentPortal"]
        CAT["CourseCatalog"]
        GR["Grades"]
    end

    subgraph Shared["Shared by all roles"]
        MC["MyCourses"]
        CD["CourseDetail<br/>tabs: announcements, materials,<br/>assignments, attendance, people, gradebook"]
        ANN["Announcements"]
    end

    subgraph Services["services/"]
        API["api.js<br/>Axios client and error messages"]
        HOOK["useApi.js<br/>useApi, useServerTable"]
        FMT["format.js<br/>dates, percents, CSV"]
    end

    APP --> Public
    APP --> PR --> LAYOUT --> RD
    RD --> DASH & TP & SP
    LAYOUT --> AdminPages & TeacherPages & StudentPages & Shared
    AdminPages & TeacherPages & StudentPages & Shared --> HOOK --> API
```

---

## 8. Database

```mermaid
erDiagram
    USERS ||--o| TEACHERS : "has login"
    USERS ||--o| STUDENTS : "has login"
    TEACHERS ||--o{ STUDENTS : advises
    TEACHERS ||--o{ COURSES : teaches
    STUDENTS ||--o{ ENROLLMENTS : has
    COURSES ||--o{ ENROLLMENTS : has
    STUDENTS ||--o{ ENROLLMENT_REQUESTS : makes
    COURSES ||--o{ ENROLLMENT_REQUESTS : receives
    USERS ||--o{ ENROLLMENT_REQUESTS : decides
    COURSES ||--o{ ANNOUNCEMENTS : has
    USERS ||--o{ ANNOUNCEMENTS : writes
    COURSES ||--o{ COURSE_MATERIALS : has
    COURSES ||--o{ ASSIGNMENTS : has
    ASSIGNMENTS ||--o{ SUBMISSIONS : receives
    STUDENTS ||--o{ SUBMISSIONS : submits
    COURSES ||--o{ ATTENDANCE_RECORDS : has
    STUDENTS ||--o{ ATTENDANCE_RECORDS : has

    USERS {
        int id PK
        string name
        string email UK
        string hashed_password
        string role "admin, teacher, student"
        bool first_login
    }
    TEACHERS {
        int id PK
        string name
        string email UK
        string subject
        string department
        int user_id FK
    }
    STUDENTS {
        int id PK
        string name
        string email UK
        int age
        string gender
        string phone_number
        int teacher_id FK
        int user_id FK
    }
    COURSES {
        int id PK
        string name
        string code UK
        int credit_hours
        string description
        int teacher_id FK
    }
    ENROLLMENTS {
        int id PK
        int student_id FK
        int course_id FK
    }
    ENROLLMENT_REQUESTS {
        int id PK
        int student_id FK
        int course_id FK
        string status "pending, approved, rejected"
        string note
        datetime created_at
        datetime decided_at
        int decided_by_id FK
    }
    ANNOUNCEMENTS {
        int id PK
        string title
        string body
        int course_id FK "empty means campus-wide"
        int author_id FK
    }
    COURSE_MATERIALS {
        int id PK
        int course_id FK
        string title
        string url
        string description
    }
    ASSIGNMENTS {
        int id PK
        int course_id FK
        string title
        string description
        datetime due_date
        int max_points
    }
    SUBMISSIONS {
        int id PK
        int assignment_id FK
        int student_id FK
        string content
        datetime submitted_at
        int score
        string feedback
        datetime graded_at
    }
    ATTENDANCE_RECORDS {
        int id PK
        int course_id FK
        int student_id FK
        date date
        string status "present, late, absent"
    }
```

---

## 9. Build and deployment

```mermaid
flowchart LR
    DEV["Developer pushes<br/>to GitHub main"] --> CI["GitHub Actions<br/>backend tests,<br/>frontend lint and build"]
    DEV --> RENDER["Render blueprint<br/>render.yaml"]
    RENDER --> APIB["itu-lms-api<br/>pip install"]
    APIB --> MIG["alembic upgrade head"]
    MIG --> SEED["seed_admin.py"]
    SEED --> RUN["uvicorn main:app"]
    RENDER --> WEBB["itu-lms-web<br/>npm run build"]
    WEBB --> STATIC["Static site with<br/>SPA rewrite to index.html"]
    RUN --> NEON[("Neon PostgreSQL")]
    RUN --> BREVO["Brevo email API"]
    STATIC -- "calls" --> RUN
```
