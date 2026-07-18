import Link from 'next/link'
import { KIDS, buildKidBoard, choreToday, getChoreLog, getExtraChores } from '@/lib/chores'
import { getCurrentUser } from '@/lib/current-user'

// Small dashboard chores peek. A signed-in kid sees their own progress bar;
// parents (and signed-out) see a compact row of everyone's done/total. Read-only
// — tap through to the Chores tab to check things off.

// Same sequential teal ramp as the Chores heatmap cell (index 0 = neutral).
const LEVEL_CLASS = [
  'bg-slate-100 dark:bg-slate-700',
  'bg-teal-200 dark:bg-teal-900',
  'bg-teal-400 dark:bg-teal-700',
  'bg-teal-500 dark:bg-teal-500',
  'bg-teal-600 dark:bg-teal-300',
]

// Percentage of the day's tasks done, mapped to the nearest shade.
function level(done: number, total: number): number {
  if (done <= 0 || total <= 0) return 0
  const f = done / total
  if (f >= 1) return 4
  return f < 0.34 ? 1 : f < 0.67 ? 2 : 3
}

function ProgressPill({ done, total }: { done: number; total: number }) {
  const complete = total > 0 && done === total
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        complete
          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
      }`}
    >
      {complete ? '✓ done' : `${done}/${total}`}
    </span>
  )
}

export default async function ChoresToday() {
  const today = choreToday()
  const [log, extra, me] = await Promise.all([getChoreLog(), getExtraChores(), getCurrentUser()])
  const boards = KIDS.map((k) => buildKidBoard(log, extra, k.name, today))
  const mine = me?.role === 'kid' ? boards.filter((b) => b.name === me.name) : boards

  return (
    <Link
      href="/chores"
      className="block rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          ✅ Chores today
        </p>
        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Open →</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {mine.map((b) => (
          <li key={b.name} className="flex items-center gap-3">
            <span className="text-xl">{b.emoji}</span>
            <span className="flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{b.name}</span>
            <span
              className={`h-5 w-5 shrink-0 rounded ${LEVEL_CLASS[level(b.doneIds.length, b.baseTotal)]}`}
              aria-hidden
            />
            <ProgressPill done={b.doneIds.length} total={b.total} />
          </li>
        ))}
      </ul>
    </Link>
  )
}
