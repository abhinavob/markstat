from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	full_name: Mapped[str] = mapped_column(String(255), nullable=False)
	email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

	exams: Mapped[list[Exam]] = relationship(
		back_populates="user",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)


class Exam(Base):
	__tablename__ = "exams"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
	filename: Mapped[str] = mapped_column(String(512), nullable=False)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
	uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

	user: Mapped[User] = relationship(back_populates="exams")
	student_results: Mapped[list[StudentResult]] = relationship(
		back_populates="exam",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)

	__table_args__ = (
		Index("ix_exams_user_uploaded_at", "user_id", "uploaded_at"),
	)


class StudentResult(Base):
	__tablename__ = "student_results"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
	student_id: Mapped[str] = mapped_column(String(128), nullable=False)
	student_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
	scores: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSONB), nullable=False, default=dict)
	total_marks: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

	exam: Mapped[Exam] = relationship(back_populates="student_results")

	__table_args__ = (
		UniqueConstraint("exam_id", "student_id", name="uq_student_results_exam_student"),
		Index("ix_student_results_exam_total_marks", "exam_id", "total_marks"),
	)
