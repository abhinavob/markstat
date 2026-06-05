from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Exam, StudentResult, User
from ..schemas import (
	AnalyticsDistributionResponse,
	AnalyticsRankingsResponse,
	AnalyticsSummaryResponse,
	RankingEntry,
)

DEFAULT_METRIC = "total"
BUCKET_SIZE = 10


def get_summary(db: Session, user: User, exam_id: int, metric: str = DEFAULT_METRIC) -> AnalyticsSummaryResponse:
	_, values = _resolve_exam_metric_values(db, user, exam_id, metric)
	count = len(values)
	average = sum(values, Decimal("0")) / Decimal(count)
	return AnalyticsSummaryResponse(
		exam_id=exam_id,
		metric=_normalize_metric(metric),
		student_count=count,
		average_marks=average.quantize(Decimal("0.01")),
		highest_marks=max(values),
		lowest_marks=min(values),
	)


def get_rankings(db: Session, user: User, exam_id: int, metric: str = DEFAULT_METRIC) -> AnalyticsRankingsResponse:
	results, metric_values = _resolve_exam_metric_values_with_results(db, user, exam_id, metric)
	sorted_rows = sorted(
		[(result, mark) for result, mark in zip(results, metric_values)],
		key=lambda item: (-item[1], item[0].student_id),
	)

	rankings: list[RankingEntry] = []
	previous_mark: Decimal | None = None
	previous_rank = 0
	for index, (result, mark) in enumerate(sorted_rows, start=1):
		if previous_mark is not None and mark == previous_mark:
			rank = previous_rank
		else:
			rank = index
		previous_mark = mark
		previous_rank = rank
		rankings.append(
			RankingEntry(
				rank=rank,
				student_id=result.student_id,
				student_name=result.student_name,
				marks=mark,
			)
		)

	return AnalyticsRankingsResponse(
		exam_id=exam_id,
		metric=_normalize_metric(metric),
		rankings=rankings,
	)


def get_distribution(db: Session, user: User, exam_id: int, metric: str = DEFAULT_METRIC) -> AnalyticsDistributionResponse:
	_, values = _resolve_exam_metric_values(db, user, exam_id, metric)
	buckets: dict[str, int] = {}
	for mark in values:
		bucket_floor = int(mark // BUCKET_SIZE) * BUCKET_SIZE
		bucket_label = f"{bucket_floor}-{bucket_floor + BUCKET_SIZE}"
		buckets[bucket_label] = buckets.get(bucket_label, 0) + 1

	ordered_buckets = dict(sorted(buckets.items(), key=lambda item: int(item[0].split("-")[0])))
	return AnalyticsDistributionResponse(
		exam_id=exam_id,
		metric=_normalize_metric(metric),
		bucket_size=BUCKET_SIZE,
		distribution=ordered_buckets,
	)


def _resolve_exam_metric_values(db: Session, user: User, exam_id: int, metric: str) -> tuple[Exam, list[Decimal]]:
	results, values = _resolve_exam_metric_values_with_results(db, user, exam_id, metric)
	exam = _get_user_exam(db, user, exam_id)
	if not results:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No imported results available")
	return exam, values


def _resolve_exam_metric_values_with_results(
	db: Session,
	user: User,
	exam_id: int,
	metric: str,
) -> tuple[list[StudentResult], list[Decimal]]:
	_get_user_exam(db, user, exam_id)
	results = db.scalars(select(StudentResult).where(StudentResult.exam_id == exam_id)).all()
	if not results:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No imported results available")

	normalized_metric = _normalize_metric(metric)
	if normalized_metric == DEFAULT_METRIC:
		values = [_to_decimal(result.total_marks) for result in results]
		return results, values

	if not any(normalized_metric in (result.scores or {}) for result in results):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown metric/component")

	values = [_to_decimal((result.scores or {}).get(normalized_metric)) for result in results]
	return results, values


def _get_user_exam(db: Session, user: User, exam_id: int) -> Exam:
	exam = db.scalar(select(Exam).where(Exam.id == exam_id, Exam.user_id == user.id))
	if exam is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
	return exam


def _normalize_metric(metric: str | None) -> str:
	if metric is None:
		return DEFAULT_METRIC
	normalized = metric.strip()
	if not normalized:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid metric parameter")
	return normalized


def _to_decimal(value: Any) -> Decimal:
	if value is None:
		return Decimal("0")
	if isinstance(value, Decimal):
		return value
	if isinstance(value, bool):
		return Decimal(int(value))
	try:
		return Decimal(str(value))
	except (InvalidOperation, TypeError, ValueError):
		return Decimal("0")
