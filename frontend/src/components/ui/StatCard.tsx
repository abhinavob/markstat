import Card from './Card'

interface StatCardProps {
  label: string
  value: string | number
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="p-5 flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-3xl font-bold text-slate-900">{value}</span>
    </Card>
  )
}
