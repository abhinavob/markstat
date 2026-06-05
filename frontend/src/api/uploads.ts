import { apiFetch } from './client'
import type {
  ColumnMappingRequest,
  ImportResultResponse,
  UploadAnalysisResponse,
} from '../types/api'

export function analyzeUpload(file: File): Promise<UploadAnalysisResponse> {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<UploadAnalysisResponse>('/uploads/analyze', {
    method: 'POST',
    body: form,
  })
}

export function importResults(
  examId: number,
  mapping: ColumnMappingRequest,
): Promise<ImportResultResponse> {
  return apiFetch<ImportResultResponse>(`/uploads/${examId}/import`, {
    method: 'POST',
    body: JSON.stringify(mapping),
  })
}
