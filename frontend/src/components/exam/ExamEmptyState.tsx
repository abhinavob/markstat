import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

export default function ExamEmptyState() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg
          className="h-7 w-7 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900">No exams yet</h3>
      <p className="mt-1 text-sm text-slate-500">
        Upload your first exam result file to get started.
      </p>
      <Button
        className="mt-6"
        onClick={() => navigate('/upload')}
      >
        Upload Exam
      </Button>
    </div>
  )
}
