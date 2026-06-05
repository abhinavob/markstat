import { apiFetch } from './client'
import type { ExamListResponse } from '../types/api'

export function listExams(): Promise<ExamListResponse> {
  return apiFetch<ExamListResponse>('/exams')
}
