import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useExamAnalytics } from '../hooks/useExamAnalytics'
import { useExams } from '../hooks/useExams'
import type { ExamListItem } from '../types/api'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import ErrorMessage from '../components/ui/ErrorMessage'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const id = Number(examId)

  // Exam metadata: prefer router state (fast), fall back to fetching the list
  const locationExam = (location.state as { exam?: ExamListItem } | null)?.exam
  const { exams } = useExams()
  const exam: ExamListItem | undefined =
    locationExam ?? exams.find((e) => e.id === id)

  const [metric, setMetric] = useState('total')
  const { summary, rankings, distribution, loading, error } = useExamAnalytics(
    id,
    metric,
  )

  // Derive available score columns from rankings response (backend returns them per-result)
  // For now metric selector is a free-text input for any score column name
  const [metricInput, setMetricInput] = useState('total')

  function applyMetric() {
    setMetric(metricInput.trim() || 'total')
  }

  const distributionData = distribution
    ? Object.entries(distribution.distribution).map(([range, count]) => ({
        range,
        count,
      }))
    : []

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Exam header */}
      {exam && (
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
            {exam.subject && <Badge variant="blue">{exam.subject}</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {exam.filename} · Uploaded {formatDate(exam.uploaded_at)}
          </p>
        </div>
      )}

      {/* Metric selector */}
      <div className="mb-6 flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Metric:</label>
        <input
          type="text"
          value={metricInput}
          onChange={(e) => setMetricInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyMetric()}
          placeholder="total or column name"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={applyMetric}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Apply
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Students" value={summary.student_count} />
            <StatCard label="Average" value={Number(summary.average_marks).toFixed(1)} />
            <StatCard label="Highest" value={Number(summary.highest_marks).toFixed(1)} />
            <StatCard label="Lowest" value={Number(summary.lowest_marks).toFixed(1)} />
          </div>

          {/* Distribution chart */}
          {distributionData.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Score Distribution
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={distributionData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" name="Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Rankings table */}
          {rankings && rankings.rankings.length > 0 && (
            <Card className="overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Rankings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Marks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankings.rankings.map((entry) => (
                      <tr key={entry.student_id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-semibold text-slate-700">
                          #{entry.rank}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-600">
                          {entry.student_id}
                        </td>
                        <td className="px-6 py-3 text-slate-700">
                          {entry.student_name ?? (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-900">
                          {Number(entry.marks).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
