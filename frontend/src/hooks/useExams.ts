import { useCallback, useEffect, useState } from 'react'
import { listExams } from '../api/exams'
import type { ExamListItem } from '../types/api'

export function useExams() {
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    listExams()
      .then((res) => setExams(res.exams))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load exams'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { exams, loading, error, refetch: fetch }
}
