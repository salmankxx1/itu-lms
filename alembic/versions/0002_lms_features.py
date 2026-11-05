"""LMS features: real user links, enrollment, announcements, materials,
assignments, submissions and attendance. Also cleans up existing data.

Revision ID: 0002_lms_features
Revises: 0001_baseline
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002_lms_features'
down_revision: Union[str, Sequence[str], None] = '0001_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TIMESTAMP_TABLES = ['users', 'teachers', 'students', 'courses']


def add_user_link(table):
    op.add_column(table, sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(f'{table}_user_id_fkey', table, 'users', ['user_id'], ['id'], ondelete='SET NULL')
    op.create_unique_constraint(f'{table}_user_id_key', table, ['user_id'])
    # Accounts were previously matched to profiles by email
    op.execute(f"UPDATE {table} p SET user_id = u.id FROM users u WHERE lower(u.email) = lower(p.email)")


def created_at():
    return sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)


def upgrade() -> None:
    add_user_link('students')
    add_user_link('teachers')
    op.add_column('courses', sa.Column('description', sa.Text(), nullable=True))

    # Older databases carry these on top of the unique constraints
    for index in ['ix_students_email', 'ix_teachers_email', 'ix_users_email']:
        op.execute(f"DROP INDEX IF EXISTS {index}")

    for table in TIMESTAMP_TABLES:
        op.alter_column(table, 'created_at', type_=sa.TIMESTAMP(timezone=True), existing_nullable=False)

    # Gender and department are chosen from fixed lists from now on
    op.execute("UPDATE students SET gender = initcap(trim(gender))")
    op.execute("UPDATE teachers SET department = upper(trim(department)) WHERE length(trim(department)) <= 3")

    op.create_table(
        'enrollments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        created_at(),
        sa.UniqueConstraint('student_id', 'course_id'),
    )
    op.create_index(op.f('ix_enrollments_student_id'), 'enrollments', ['student_id'])
    op.create_index(op.f('ix_enrollments_course_id'), 'enrollments', ['course_id'])

    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=True),
        sa.Column('author_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        created_at(),
    )
    op.create_index(op.f('ix_announcements_course_id'), 'announcements', ['course_id'])

    op.create_table(
        'course_materials',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        created_at(),
    )
    op.create_index(op.f('ix_course_materials_course_id'), 'course_materials', ['course_id'])

    op.create_table(
        'assignments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('max_points', sa.Integer(), nullable=False),
        created_at(),
    )
    op.create_index(op.f('ix_assignments_course_id'), 'assignments', ['course_id'])

    op.create_table(
        'submissions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('assignment_id', sa.Integer(), sa.ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('submitted_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('graded_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint('assignment_id', 'student_id'),
    )
    op.create_index(op.f('ix_submissions_assignment_id'), 'submissions', ['assignment_id'])
    op.create_index(op.f('ix_submissions_student_id'), 'submissions', ['student_id'])

    op.create_table(
        'attendance_records',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.UniqueConstraint('course_id', 'student_id', 'date'),
    )
    op.create_index(op.f('ix_attendance_records_course_id'), 'attendance_records', ['course_id'])
    op.create_index(op.f('ix_attendance_records_student_id'), 'attendance_records', ['student_id'])


def downgrade() -> None:
    for table in ['attendance_records', 'submissions', 'assignments', 'course_materials', 'announcements', 'enrollments']:
        op.drop_table(table)

    for table in TIMESTAMP_TABLES:
        op.alter_column(table, 'created_at', type_=sa.TIMESTAMP(), existing_nullable=False)

    op.drop_column('courses', 'description')

    for table in ['teachers', 'students']:
        op.drop_constraint(f'{table}_user_id_key', table, type_='unique')
        op.drop_constraint(f'{table}_user_id_fkey', table, type_='foreignkey')
        op.drop_column(table, 'user_id')
