'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleChore } from '@/app/actions'
import type { DayCell, KidBoard } from '@/lib/chores'

// Sequential teal ramp. Light surface: light→dark as magnitude rises. Dark
// surface: its own steps, dark→light (validated against the dark surface, not a
// flip). Index 0 is the empty/neutral cell.
const LEVEL_CLASS = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-teal-200 dark:bg-teal-900',
  'bg-teal-400 dark:bg-teal-700',
  'bg-teal-500 dark:bg-teal-500',
  'bg-teal-600 dark:bg-teal-300',
]

function level(count: number, total: number): number {
  if (count <= 0) return 0
  if (count >= total) return 4
  const f = count / total
  return f < 0.34 ? 1 : f < 0.67 ? 2 : 3
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function Heatmap({ weeks, total, today }: { weeks: DayCell[][]; total: number; today: string }) {
  // Month label above the first column of each new month.
  const monthLabels = weeks.map((w, i) => {
    const m = Number(w[0].date.slice(5, 7))
    const prev = i > 0 ? Number(weeks[i - 1][0].date.slice(5, 7)) : -1
    return m !== prev ? MONTHS[m - 1] : ''
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="mb-1 flex gap-[3px] pl-0">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-3 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell) =>
                cell.future ? (
                  <div key={cell.date} className="h-3 w-3 rounded-[3px]" />
                ) : (
                  <div
                    key={cell.date}
                    title={`${cell.date} · ${cell.count}/${total} done`}
                    className={`h-3 w-3 rounded-[3px] ${LEVEL_CLASS[level(cell.count, total)]} ${
                      cell.date === today ? 'ring-2 ring-teal-600 ring-offset-1 dark:ring-teal-300 dark:ring-offset-slate-800' : ''
                    }`}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KidCard({ kid, today, editable }: { kid: KidBoard; today: string; editable: boolean }) {
  const router = useRouter()
  const [done, setDone] = useState<Set<string>>(() => new Set(kid.doneIds))
  const [, startTransition] = useTransition()

  const count = done.size
  const allDone = count >= kid.total

  function toggle(taskId: string) {
    if (!editable) return
    const willDo = !done.has(taskId)
    setDone((prev) => {
      const next = new Set(prev)
      if (willDo) next.add(taskId)
      else next.delete(taskId)
      return next
    })
    startTransition(async () => {
      await toggleChore(kid.name, taskId, willDo)
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">{kid.emoji}</span>
        <span className="text-lg font-black text-slate-900 dark:text-white" style={{ color: kid.color }}>
          {kid.name}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {kid.current > 0 && (
            <span className="text-xs font-bold text-orange-500 dark:text-orange-400">🔥 {kid.current}</span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-black tabular-nums ${
              allDone
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {allDone ? 'All done! 🎉' : `${count}/${kid.total}`}
          </span>
        </span>
      </div>

      {/* Today's checklist — interactive only for the signed-in kid */}
      <div className="mb-3 flex flex-wrap gap-2">
        {kid.tasks.map((t) => {
          const checked = done.has(t.id)
          const base = `flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold ${
            checked
              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/40 dark:text-teal-200'
              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`
          const mark = (
            <span className={checked ? 'text-teal-600 dark:text-teal-300' : 'text-slate-300 dark:text-slate-600'}>
              {checked ? '✓' : editable ? '＋' : '·'}
            </span>
          )
          return editable ? (
            <button key={t.id} onClick={() => toggle(t.id)} className={`${base} transition`}>
              <span>{t.emoji}</span>
              {t.label}
              {mark}
            </button>
          ) : (
            <div key={t.id} className={`${base} ${checked ? '' : 'opacity-60'}`}>
              <span>{t.emoji}</span>
              {t.label}
              {mark}
            </div>
          )
        })}
      </div>

      {/* Contribution grid */}
      <Heatmap weeks={kid.weeks} total={kid.total} today={today} />
      {kid.longest > 0 && (
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          Longest streak: {kid.longest} {kid.longest === 1 ? 'day' : 'days'}
        </p>
      )}
    </div>
  )
}

export default function ChoresBoard({
  today,
  kids,
  currentName,
}: {
  today: string
  kids: KidBoard[]
  currentName: string | null
}) {
  const isKid = kids.some((k) => k.name === currentName)
  return (
    <div className="space-y-4">
      {!currentName ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          👋 Pick who you are on the <strong>Points</strong> tab to check off your chores.
        </p>
      ) : !isKid ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Signed in as <strong>{currentName}</strong> — cheering the kids on! 👀
        </p>
      ) : null}

      {kids.map((kid) => (
        <KidCard key={kid.name} kid={kid} today={today} editable={kid.name === currentName} />
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 pr-1 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        {LEVEL_CLASS.map((c, i) => (
          <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
