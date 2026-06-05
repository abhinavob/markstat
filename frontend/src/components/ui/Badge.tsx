interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'slate' | 'emerald'
}

const variants = {
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ children, variant = 'slate' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
