from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import AnalyticsDistributionResponse, AnalyticsRankingsResponse, AnalyticsSummaryResponse
from ..security import get_current_user
from ..services.analytics import get_distribution, get_rankings, get_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/exams/{exam_id}/summary", response_model=AnalyticsSummaryResponse)
def get_exam_summary(
	exam_id: int,
	metric: str = Query(default="total"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
) -> AnalyticsSummaryResponse:
	return get_summary(db, current_user, exam_id, metric)


@router.get("/exams/{exam_id}/rankings", response_model=AnalyticsRankingsResponse)
def get_exam_rankings(
	exam_id: int,
	metric: str = Query(default="total"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
) -> AnalyticsRankingsResponse:
	return get_rankings(db, current_user, exam_id, metric)


@router.get("/exams/{exam_id}/distribution", response_model=AnalyticsDistributionResponse)
def get_exam_distribution(
	exam_id: int,
	metric: str = Query(default="total"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
) -> AnalyticsDistributionResponse:
	return get_distribution(db, current_user, exam_id, metric)
