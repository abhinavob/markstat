"""initial schema for MarkStat"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "exams",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("filename", sa.String(length=512), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_exams_user_id"), "exams", ["user_id"], unique=False)
    op.create_index("ix_exams_user_uploaded_at", "exams", ["user_id", "uploaded_at"], unique=False)

    op.create_table(
        "student_results",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(length=128), nullable=False),
        sa.Column("student_name", sa.String(length=255), nullable=True),
        sa.Column("scores", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("total_marks", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.UniqueConstraint("exam_id", "student_id", name="uq_student_results_exam_student"),
    )
    op.create_index(op.f("ix_student_results_exam_id"), "student_results", ["exam_id"], unique=False)
    op.create_index(op.f("ix_student_results_student_name"), "student_results", ["student_name"], unique=False)
    op.create_index("ix_student_results_exam_total_marks", "student_results", ["exam_id", "total_marks"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_student_results_exam_total_marks", table_name="student_results")
    op.drop_index(op.f("ix_student_results_student_name"), table_name="student_results")
    op.drop_index(op.f("ix_student_results_exam_id"), table_name="student_results")
    op.drop_table("student_results")

    op.drop_index("ix_exams_user_uploaded_at", table_name="exams")
    op.drop_index(op.f("ix_exams_user_id"), table_name="exams")
    op.drop_table("exams")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
