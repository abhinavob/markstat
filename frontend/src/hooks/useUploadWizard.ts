import { useState } from 'react'
import { analyzeUpload, importResults } from '../api/uploads'
import type {
  ColumnMappingRequest,
  ImportResultResponse,
  UploadAnalysisResponse,
} from '../types/api'

type WizardStep = 'select' | 'map' | 'done'

interface WizardState {
  step: WizardStep
  analyzeResult: UploadAnalysisResponse | null
  importResult: ImportResultResponse | null
  loading: boolean
  error: string | null
}

export function useUploadWizard() {
  const [state, setState] = useState<WizardState>({
    step: 'select',
    analyzeResult: null,
    importResult: null,
    loading: false,
    error: null,
  })

  async function analyze(file: File) {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await analyzeUpload(file)
      setState((s) => ({
        ...s,
        loading: false,
        step: 'map',
        analyzeResult: result,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to analyze file',
      }))
    }
  }

  async function importExam(mapping: ColumnMappingRequest) {
    if (!state.analyzeResult) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await importResults(state.analyzeResult.exam_id, mapping)
      setState((s) => ({
        ...s,
        loading: false,
        step: 'done',
        importResult: result,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to import results',
      }))
    }
  }

  function reset() {
    setState({
      step: 'select',
      analyzeResult: null,
      importResult: null,
      loading: false,
      error: null,
    })
  }

  return { ...state, analyze, importExam, reset }
}
