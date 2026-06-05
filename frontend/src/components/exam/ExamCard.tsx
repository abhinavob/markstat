import { useNavigate } from 'react-router-dom'
import type { ExamListItem } from '../../types/api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

interface ExamCardProps {
  exam: ExamListItem
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ExamCard({ exam }: ExamCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
      onClick={() =>
        navigate(`/exams/${exam.id}`, { state: { exam } })
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{exam.title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{exam.filename}</p>
        </div>
        {exam.subject && <Badge variant="blue">{exam.subject}</Badge>}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Uploaded {formatDate(exam.uploaded_at)}
      </p>
    </Card>
  )
}
