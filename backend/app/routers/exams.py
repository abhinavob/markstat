from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Exam, User
from ..schemas import ExamListItem, ExamListResponse
from ..security import get_current_user

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("", response_model=ExamListResponse)
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExamListResponse:
    exams = db.scalars(
        select(Exam)
        .where(Exam.user_id == current_user.id)
        .order_by(Exam.uploaded_at.desc())
    ).all()

    return ExamListResponse(
        exams=[
            ExamListItem(
                id=exam.id,
                title=exam.title,
                subject=exam.subject,
                filename=exam.filename,
                uploaded_at=exam.uploaded_at,
            )
            for exam in exams
        ]
    )