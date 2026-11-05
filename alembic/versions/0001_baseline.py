"""Baseline: the schema as it stood before the LMS features.

Replaces the original migration chain, which could not build a fresh database.
An existing database is stamped at this revision instead of running it.

Revision ID: 0001_baseline
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0001_baseline'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def timestamp_column(name='created_at'):
    return sa.Column(name, sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        timestamp_column(),
        sa.Column('first_login', sa.Boolean(), nullable=False),
    )
    op.create_table(
        'teachers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        timestamp_column(),
    )
    op.create_table(
        'students',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('teacher_id', sa.Integer(), sa.ForeignKey('teachers.id'), nullable=True),
        timestamp_column(),
    )
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False, unique=True),
        sa.Column('credit_hours', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), sa.ForeignKey('teachers.id'), nullable=True),
        timestamp_column(),
    )


def downgrade() -> None:
    op.drop_table('courses')
    op.drop_table('students')
    op.drop_table('teachers')
    op.drop_table('users')
