import { useNavigate } from 'react-router-dom'
import { useExams } from '../hooks/useExams'
import ExamCard from '../components/exam/ExamCard'
import ExamEmptyState from '../components/exam/ExamEmptyState'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorMessage from '../components/ui/ErrorMessage'

export default function DashboardPage() {
  const { exams, loading, error } = useExams()
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Exams</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {exams.length > 0
              ? `${exams.length} exam${exams.length === 1 ? '' : 's'} uploaded`
              : 'View and analyze your uploaded exam results'}
          </p>
        </div>
        {exams.length > 0 && (
          <Button onClick={() => navigate('/upload')}>Upload Exam</Button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {!loading && !error && exams.length === 0 && <ExamEmptyState />}

      {!loading && !error && exams.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  )
}
