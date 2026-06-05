import type { ApiError } from '../types/api'

const BASE_URL = '/api'

export class ApiResponseError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail)
    this.name = 'ApiResponseError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('token')

  const isFormData = options.body instanceof FormData
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`
    try {
      const err = (await response.json()) as ApiError
      detail = err.detail ?? detail
    } catch {
      // use default detail
    }
    if (response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    throw new ApiResponseError(response.status, detail)
  }

  return response.json() as Promise<T>
}
