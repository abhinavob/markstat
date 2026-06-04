from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ColumnMappingRequest, ImportResultResponse, UploadAnalysisResponse
from ..security import get_current_user
from ..services.uploads import analyze_uploaded_file, import_exam_results

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/analyze", response_model=UploadAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_upload(
	file: UploadFile = File(...),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
) -> UploadAnalysisResponse:
	return await analyze_uploaded_file(db, current_user, file)


@router.post("/{exam_id}/import", response_model=ImportResultResponse)
def import_upload_results(
	exam_id: int,
	payload: ColumnMappingRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
) -> ImportResultResponse:
	return import_exam_results(db, current_user, exam_id, payload)
