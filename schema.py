from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]

# Upper limits stop anyone filling the database with huge text
LongText = Annotated[str, StringConstraints(max_length=10000)]
SubmissionText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20000)]


def blank_to_none(value):
    return None if value == "" else value


# HTML forms send "" for an unselected dropdown
OptionalId = Annotated[int | None, BeforeValidator(blank_to_none)]


# -------------------- Teacher --------------------

class TeacherBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str
    department: str


class TeacherResponse(TeacherBase):
    account_status: str


class TeacherCreated(TeacherResponse):
    email_sent: bool
    temporary_password: str | None = None


class CreateTeacher(BaseModel):
    name: NonEmptyStr
    email: EmailStr
    subject: NonEmptyStr
    department: NonEmptyStr


# -------------------- Student --------------------

class StudentBase(BaseModel):
    name: NonEmptyStr
    email: EmailStr
    age: int = Field(gt=0, le=120)
    gender: Literal["Male", "Female", "Other"]
    teacher_id: OptionalId = None

    @field_validator("gender", mode="before")
    @classmethod
    def normalize_gender(cls, value):
        return value.strip().title() if isinstance(value, str) else value


class CreateStudent(StudentBase):
    pass


class UpdateStudent(StudentBase):
    pass


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    age: int
    gender: str
    teacher_id: int | None = None
    teacher: TeacherBase | None = None
    account_status: str


class StudentCreated(StudentResponse):
    email_sent: bool
    temporary_password: str | None = None


# -------------------- Course --------------------

class CourseBase(BaseModel):
    name: NonEmptyStr
    code: NonEmptyStr
    credit_hours: int = Field(ge=1, le=12)
    description: LongText | None = None
    teacher_id: OptionalId = None


class CreateCourse(CourseBase):
    pass


class UpdateCourse(CourseBase):
    pass


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    credit_hours: int
    description: str | None = None
    teacher_id: int | None = None
    teacher: TeacherBase | None = None


class CourseDetail(CourseResponse):
    enrolled_count: int
    can_manage: bool
    is_enrolled: bool


# -------------------- User --------------------

class UserLogin(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=256)


class TemporaryLogin(BaseModel):
    email: str
    temporary_password: str
    email_sent: bool


class ChangePassword(BaseModel):
    current_password: str = Field(max_length=256)
    new_password: str = Field(min_length=8, max_length=72)


# -------------------- Pagination --------------------

class StudentListResponse(BaseModel):
    data: list[StudentResponse]
    total: int


class TeacherListResponse(BaseModel):
    data: list[TeacherResponse]
    total: int


class CourseListResponse(BaseModel):
    data: list[CourseResponse]
    total: int


# -------------------- Dashboard --------------------

class GenderChart(BaseModel):
    name: str
    value: int


class StudentsPerTeacherChart(BaseModel):
    teacher: str
    students: int


class CoursesPerTeacherChart(BaseModel):
    teacher: str
    courses: int


class StudentsPerMonthChart(BaseModel):
    month: str
    students: int


class RecentStudent(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DashboardResponse(BaseModel):
    students: int
    teachers: int
    courses: int
    enrollments: int
    studentsWithoutLogin: int
    teachersWithoutLogin: int
    gender: list[GenderChart]
    studentsPerTeacher: list[StudentsPerTeacherChart]
    coursesPerTeacher: list[CoursesPerTeacherChart]
    studentsPerMonth: list[StudentsPerMonthChart]
    recentStudents: list[RecentStudent]


# -------------------- Enrollment --------------------

class EnrollStudent(BaseModel):
    student_id: int


class EnrolledStudent(BaseModel):
    id: int
    name: str
    email: str


# -------------------- Announcements --------------------

class CreateAnnouncement(BaseModel):
    title: NonEmptyStr
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]
    course_id: OptionalId = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    body: str
    course_id: int | None
    course_code: str | None
    author_name: str | None
    created_at: datetime
    can_delete: bool


# -------------------- Materials --------------------

class CreateMaterial(BaseModel):
    title: NonEmptyStr
    url: AnyHttpUrl
    description: LongText | None = None


class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str
    description: str | None
    created_at: datetime


# -------------------- Assignments --------------------

class AssignmentInput(BaseModel):
    title: NonEmptyStr
    description: LongText | None = None
    due_date: datetime
    max_points: int = Field(ge=1, le=1000)


class SubmitAssignment(BaseModel):
    content: SubmissionText


class GradeSubmission(BaseModel):
    score: int = Field(ge=0)
    feedback: LongText | None = None


class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    content: str
    submitted_at: datetime
    is_late: bool
    score: int | None
    feedback: str | None


class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str | None
    due_date: datetime
    max_points: int
    submission_count: int | None = None
    graded_count: int | None = None
    my_submission: SubmissionResponse | None = None


# -------------------- Attendance --------------------

AttendanceStatus = Literal["present", "absent", "late"]


class AttendanceEntry(BaseModel):
    student_id: int
    status: AttendanceStatus


class SaveAttendance(BaseModel):
    date: date
    records: list[AttendanceEntry]


class AttendanceRow(BaseModel):
    student_id: int
    student_name: str
    status: AttendanceStatus | None


class AttendanceDay(BaseModel):
    date: date
    status: AttendanceStatus


class MyAttendance(BaseModel):
    percent: float | None
    records: list[AttendanceDay]


# -------------------- Grades --------------------

class GradebookCell(BaseModel):
    assignment_id: int
    score: int | None


class GradebookRow(BaseModel):
    student_id: int
    student_name: str
    cells: list[GradebookCell]
    percent: float | None
    letter: str | None
    attendance_percent: float | None


class GradebookColumn(BaseModel):
    id: int
    title: str
    max_points: int


class Gradebook(BaseModel):
    assignments: list[GradebookColumn]
    rows: list[GradebookRow]


class CourseGrade(BaseModel):
    course_id: int
    code: str
    name: str
    credit_hours: int
    percent: float | None
    letter: str | None


class MyGrades(BaseModel):
    courses: list[CourseGrade]
    gpa: float | None


# -------------------- Overview --------------------

class MeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    first_login: bool


class UpcomingAssignment(BaseModel):
    id: int
    title: str
    course_id: int
    course_code: str
    due_date: datetime
    submitted: bool


class OverviewCourse(BaseModel):
    id: int
    code: str
    name: str
    credit_hours: int
    teacher_name: str | None
    enrolled_count: int
    attendance_percent: float | None = None
    percent: float | None = None
    letter: str | None = None
    pending_grading: int | None = None


class Overview(BaseModel):
    name: str
    role: str
    detail: str
    courses: list[OverviewCourse]
    upcoming: list[UpcomingAssignment]
    announcements: list[AnnouncementResponse]
    gpa: float | None = None
    attendance_percent: float | None = None
    students_total: int | None = None
    pending_grading: int | None = None
