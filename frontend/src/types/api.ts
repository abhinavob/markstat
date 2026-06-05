export interface UserRead {
  id: number
  full_name: string
  email: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface AuthResponse {
  user: UserRead
  token: Token
}

export interface ExamListItem {
  id: number
  title: string
  subject: string | null
  filename: string
  uploaded_at: string
}

export interface ExamListResponse {
  exams: ExamListItem[]
}

export interface UploadAnalysisResponse {
  exam_id: number
  filename: string
  file_type: string
  sheet_names: string[]
  columns: string[]
  preview_rows: Record<string, unknown>[]
  selected_source: string | null
  total_rows: number
}

export interface ColumnMappingRequest {
  sheet_name?: string | null
  student_id_column: string
  student_name_column?: string | null
  score_columns: string[]
  total_column?: string | null
}

export interface ImportResultResponse {
  exam_id: number
  imported_count: number
  skipped_count: number
  total_rows: number
}

export interface AnalyticsSummaryResponse {
  exam_id: number
  metric: string
  student_count: number
  average_marks: number
  highest_marks: number
  lowest_marks: number
}

export interface RankingEntry {
  rank: number
  student_id: string
  student_name: string | null
  marks: number
}

export interface AnalyticsRankingsResponse {
  exam_id: number
  metric: string
  rankings: RankingEntry[]
}

export interface AnalyticsDistributionResponse {
  exam_id: number
  metric: string
  bucket_size: number
  distribution: Record<string, number>
}

export interface ApiError {
  detail: string
}
