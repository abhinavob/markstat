import { useNavigate } from 'react-router-dom'
import { useUploadWizard } from '../hooks/useUploadWizard'
import FileDropzone from '../components/upload/FileDropzone'
import PreviewTable from '../components/upload/PreviewTable'
import ColumnMappingForm from '../components/upload/ColumnMappingForm'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import Card from '../components/ui/Card'

const STEPS = ['Select File', 'Map Columns', 'Done'] as const

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-400'}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function UploadPage() {
  const navigate = useNavigate()
  const wizard = useUploadWizard()

  const stepIndex = wizard.step === 'select' ? 0 : wizard.step === 'map' ? 1 : 2

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload Exam</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Import results from a PDF or Excel file
        </p>
      </div>

      <StepIndicator current={stepIndex} />

      {wizard.step === 'select' && (
        <Card className="p-6">
          {wizard.error && (
            <div className="mb-4">
              <ErrorMessage message={wizard.error} />
            </div>
          )}
          <FileDropzone onFileSelected={wizard.analyze} loading={wizard.loading} />
        </Card>
      )}

      {wizard.step === 'map' && wizard.analyzeResult && (
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              File Preview
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Showing first {wizard.analyzeResult.preview_rows.length} of{' '}
              {wizard.analyzeResult.total_rows} rows from{' '}
              <span className="font-medium">{wizard.analyzeResult.filename}</span>
            </p>
            <PreviewTable
              columns={wizard.analyzeResult.columns}
              rows={wizard.analyzeResult.preview_rows}
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Map Columns
            </h2>
            <ColumnMappingForm
              analysis={wizard.analyzeResult}
              onSubmit={wizard.importExam}
              loading={wizard.loading}
              error={wizard.error}
            />
          </Card>
        </div>
      )}

      {wizard.step === 'done' && wizard.importResult && (
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-7 w-7 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Import Complete</h2>
          <p className="mt-2 text-sm text-slate-500">
            Imported{' '}
            <span className="font-semibold text-slate-700">
              {wizard.importResult.imported_count}
            </span>{' '}
            students
            {wizard.importResult.skipped_count > 0 && (
              <>
                ,{' '}
                <span className="font-semibold text-amber-600">
                  {wizard.importResult.skipped_count}
                </span>{' '}
                rows skipped
              </>
            )}{' '}
            out of {wizard.importResult.total_rows} total rows.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={wizard.reset}
            >
              Upload Another
            </Button>
            <Button
              onClick={() =>
                navigate(`/exams/${wizard.importResult!.exam_id}`)
              }
            >
              View Results
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
