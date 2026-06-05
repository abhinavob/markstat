import { apiFetch } from './client'
import type {
  AnalyticsDistributionResponse,
  AnalyticsRankingsResponse,
  AnalyticsSummaryResponse,
} from '../types/api'

export function getSummary(
  examId: number,
  metric = 'total',
): Promise<AnalyticsSummaryResponse> {
  return apiFetch<AnalyticsSummaryResponse>(
    `/analytics/exams/${examId}/summary?metric=${encodeURIComponent(metric)}`,
  )
}

export function getRankings(
  examId: number,
  metric = 'total',
): Promise<AnalyticsRankingsResponse> {
  return apiFetch<AnalyticsRankingsResponse>(
    `/analytics/exams/${examId}/rankings?metric=${encodeURIComponent(metric)}`,
  )
}

export function getDistribution(
  examId: number,
  metric = 'total',
): Promise<AnalyticsDistributionResponse> {
  return apiFetch<AnalyticsDistributionResponse>(
    `/analytics/exams/${examId}/distribution?metric=${encodeURIComponent(metric)}`,
  )
}
