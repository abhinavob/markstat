import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">MarkStat</h1>
          <p className="mt-1 text-sm text-slate-500">Student Result Analytics</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
