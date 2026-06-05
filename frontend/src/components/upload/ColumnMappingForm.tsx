import { useState, type FormEvent } from 'react'
import type { ColumnMappingRequest, UploadAnalysisResponse } from '../../types/api'
import Button from '../ui/Button'
import ErrorMessage from '../ui/ErrorMessage'

interface ColumnMappingFormProps {
  analysis: UploadAnalysisResponse
  onSubmit: (mapping: ColumnMappingRequest) => void
  loading: boolean
  error: string | null
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  includeEmpty = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  required?: boolean
  includeEmpty?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {includeEmpty && <option value="">— None —</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ColumnMappingForm({
  analysis,
  onSubmit,
  loading,
  error,
}: ColumnMappingFormProps) {
  const { columns, sheet_names } = analysis

  const [sheet, setSheet] = useState(sheet_names[0] ?? '')
  const [studentIdCol, setStudentIdCol] = useState(columns[0] ?? '')
  const [studentNameCol, setStudentNameCol] = useState('')
  const [scoreColumns, setScoreColumns] = useState<string[]>([])
  const [totalCol, setTotalCol] = useState('')
  const [validationError, setValidationError] = useState('')

  function toggleScoreColumn(col: string) {
    setScoreColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError('')

    if (!studentIdCol) {
      setValidationError('Student ID column is required.')
      return
    }
    if (scoreColumns.length === 0) {
      setValidationError('Select at least one score column.')
      return
    }
    if (totalCol && scoreColumns.includes(totalCol)) {
      setValidationError('Total column cannot also be a score column.')
      return
    }

    const mapping: ColumnMappingRequest = {
      sheet_name: sheet_names.length > 1 ? sheet : null,
      student_id_column: studentIdCol,
      student_name_column: studentNameCol || null,
      score_columns: scoreColumns,
      total_column: totalCol || null,
    }
    onSubmit(mapping)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {(error ?? validationError) && (
        <ErrorMessage message={error ?? validationError} />
      )}

      {sheet_names.length > 1 && (
        <SelectField
          label="Sheet"
          value={sheet}
          onChange={setSheet}
          options={sheet_names}
          required
        />
      )}

      <SelectField
        label="Student ID column"
        value={studentIdCol}
        onChange={setStudentIdCol}
        options={columns}
        required
      />

      <SelectField
        label="Student name column"
        value={studentNameCol}
        onChange={setStudentNameCol}
        options={columns}
        includeEmpty
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">
          Score columns <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">Select all columns that contain scores.</p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
          {columns.map((col) => (
            <label key={col} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scoreColumns.includes(col)}
                onChange={() => toggleScoreColumn(col)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="truncate text-slate-700">{col}</span>
            </label>
          ))}
        </div>
      </div>

      <SelectField
        label="Total marks column (optional — leave blank to sum score columns)"
        value={totalCol}
        onChange={setTotalCol}
        options={columns}
        includeEmpty
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          Import Results
        </Button>
      </div>
    </form>
  )
}
