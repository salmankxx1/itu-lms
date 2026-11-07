"""Students request courses and an admin approves or rejects them.

Revision ID: 0003_enrollment_requests
Revises: 0002_lms_features
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0003_enrollment_requests'
down_revision: Union[str, Sequence[str], None] = '0002_lms_features'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'enrollment_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.Integer(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('decided_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('decided_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.UniqueConstraint('student_id', 'course_id'),
    )
    op.create_index(op.f('ix_enrollment_requests_status'), 'enrollment_requests', ['status'])
    op.create_index(op.f('ix_enrollment_requests_course_id'), 'enrollment_requests', ['course_id'])


def downgrade() -> None:
    op.drop_table('enrollment_requests')
