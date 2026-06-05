import { useCallback, useEffect, useState } from 'react'
import { getDistribution, getRankings, getSummary } from '../api/analytics'
import type {
  AnalyticsDistributionResponse,
  AnalyticsRankingsResponse,
  AnalyticsSummaryResponse,
} from '../types/api'

interface ExamAnalyticsState {
  summary: AnalyticsSummaryResponse | null
  rankings: AnalyticsRankingsResponse | null
  distribution: AnalyticsDistributionResponse | null
  loading: boolean
  error: string | null
}

export function useExamAnalytics(examId: number, metric: string) {
  const [state, setState] = useState<ExamAnalyticsState>({
    summary: null,
    rankings: null,
    distribution: null,
    loading: true,
    error: null,
  })

  const fetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.all([
      getSummary(examId, metric),
      getRankings(examId, metric),
      getDistribution(examId, metric),
    ])
      .then(([summary, rankings, distribution]) => {
        setState({ summary, rankings, distribution, loading: false, error: null })
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load analytics',
        }))
      })
  }, [examId, metric])

  useEffect(() => {
    fetch()
  }, [fetch])

  return state
}
