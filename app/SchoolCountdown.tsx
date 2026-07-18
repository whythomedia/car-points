import { choreToday } from '@/lib/chores'

// First day of school. Update this each year.
export const SCHOOL_START = '2026-08-12'

function daysUntil(target: string, today: string): number {
  return Math.round(
    (Date.parse(target + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000
  )
}

export default function SchoolCountdown() {
  const today = choreToday()
  const days = daysUntil(SCHOOL_START, today)

  let big: string
  let sub: string
  if (days > 1) {
    big = `${days} days`
    sub = 'until the first day of school 🎒'
  } else if (days === 1) {
    big = '1 day'
    sub = 'until the first day of school 🎒'
  } else if (days === 0) {
    big = 'Today! 🎒'
    sub = 'First day of school — good luck!'
  } else {
    big = "You're in school 📚"
    sub = 'Hope you had a great summer!'
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Countdown to school
      </p>
      <p className="mt-1 text-3xl font-black text-teal-600 dark:text-teal-400">{big}</p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sub}</p>
    </div>
  )
}
