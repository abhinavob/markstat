from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Exam, StudentResult, User
from ..schemas import ColumnMappingRequest, ImportResultResponse, UploadAnalysisResponse
from .file_parser import extract_tabular_file, to_decimal, to_text

ALLOWED_EXTENSIONS = {".pdf", ".xlsx"}


def _storage_root() -> Path:
	settings = get_settings()
	root = Path(settings.upload_storage_dir)
	root.mkdir(parents=True, exist_ok=True)
	return root


def _sanitize_filename(filename: str) -> str:
	return Path(filename).name


def _validate_filename(filename: str) -> None:
	if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Only PDF and XLSX files are supported",
		)


def _build_exam_path(exam_id: int, filename: str) -> Path:
	return _storage_root() / f"exam_{exam_id}" / filename


def _save_upload(upload: UploadFile, destination: Path) -> None:
	destination.parent.mkdir(parents=True, exist_ok=True)
	with destination.open("wb") as target:
		shutil.copyfileobj(upload.file, target)


async def analyze_uploaded_file(db: Session, user: User, upload: UploadFile) -> UploadAnalysisResponse:
	if not upload.filename:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A file name is required")

	original_filename = _sanitize_filename(upload.filename)
	_validate_filename(original_filename)

	exam = Exam(
		title=Path(original_filename).stem or original_filename,
		filename=original_filename,
		user_id=user.id,
	)
	db.add(exam)
	db.flush()

	storage_path = _build_exam_path(exam.id, original_filename)
	try:
		await upload.seek(0)
		_save_upload(upload, storage_path)
		parsed_file = extract_tabular_file(storage_path)
		db.commit()
	except Exception:
		db.rollback()
		if storage_path.exists():
			storage_path.unlink()
		raise

	return UploadAnalysisResponse(
		exam_id=exam.id,
		filename=original_filename,
		file_type=parsed_file.file_type,
		sheet_names=parsed_file.sheet_names,
		columns=parsed_file.columns,
		preview_rows=parsed_file.preview_rows,
		selected_source=parsed_file.selected_source,
		total_rows=len(parsed_file.rows),
	)


def import_exam_results(db: Session, user: User, exam_id: int, payload: ColumnMappingRequest) -> ImportResultResponse:
	exam = db.scalar(select(Exam).where(Exam.id == exam_id, Exam.user_id == user.id))
	if exam is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

	file_path = _build_exam_path(exam.id, exam.filename)
	if not file_path.exists():
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded file is missing from storage")

	parsed_file = extract_tabular_file(file_path, sheet_name=payload.sheet_name)
	missing_columns = [column for column in [payload.student_id_column, payload.student_name_column, payload.total_column, *payload.score_columns] if column and column not in parsed_file.columns]
	if missing_columns:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=f"Unknown columns in mapping: {', '.join(missing_columns)}",
		)

	db.execute(delete(StudentResult).where(StudentResult.exam_id == exam.id))

	imported_count = 0
	skipped_count = 0
	seen_student_ids: set[str] = set()
	for row in parsed_file.rows:
		student_id = to_text(row.get(payload.student_id_column))
		if not student_id:
			skipped_count += 1
			continue

		if student_id in seen_student_ids:
			skipped_count += 1
			continue

		seen_student_ids.add(student_id)

		student_name = to_text(row.get(payload.student_name_column)) if payload.student_name_column else None
		scores = {column: row.get(column) for column in payload.score_columns}
		if payload.total_column:
			total_marks = to_decimal(row.get(payload.total_column))
		else:
			total_marks = sum((to_decimal(row.get(column)) for column in payload.score_columns), start=to_decimal(0))

		db.add(
			StudentResult(
				exam_id=exam.id,
				student_id=student_id,
				student_name=student_name,
				scores=scores,
				total_marks=total_marks,
			)
		)
		imported_count += 1

	db.commit()
	return ImportResultResponse(
		exam_id=exam.id,
		imported_count=imported_count,
		skipped_count=skipped_count,
		total_rows=len(parsed_file.rows),
	)