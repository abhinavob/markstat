import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white shadow-sm border border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
