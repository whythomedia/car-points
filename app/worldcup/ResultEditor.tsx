'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorldCupResult } from '@/app/actions'
import TeamFlag from './TeamFlag'

export type EditableMatch = {
  group: string
  homeName: string
  homeFlag: string
  awayName: string
  awayFlag: string
  ga: number // predicted
  gb: number // predicted
}

function MatchRow({ match }: { match: EditableMatch }) {
  const router = useRouter()
  const [ga, setGa] = useState(String(match.ga))
  const [gb, setGb] = useState(String(match.gb))
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await saveWorldCupResult(match.group, match.homeName, match.awayName, Number(ga), Number(gb))
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-2 py-2 text-sm">
      <span className="flex flex-1 items-center justify-end gap-1.5 text-right text-slate-700 dark:text-slate-200">
        {match.homeName} <TeamFlag name={match.homeName} emoji={match.homeFlag} size={18} />
      </span>
      <input
        inputMode="numeric"
        value={ga}
        onChange={(e) => setGa(e.target.value.replace(/\D/g, '').slice(0, 2))}
        className="w-9 rounded-md border border-slate-200 bg-white py-1 text-center text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />
      <span className="text-slate-400">–</span>
      <input
        inputMode="numeric"
        value={gb}
        onChange={(e) => setGb(e.target.value.replace(/\D/g, '').slice(0, 2))}
        className="w-9 rounded-md border border-slate-200 bg-white py-1 text-center text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />
      <span className="flex flex-1 items-center gap-1.5 text-left text-slate-700 dark:text-slate-200">
        <TeamFlag name={match.awayName} emoji={match.awayFlag} size={18} /> {match.awayName}
      </span>
      <button
        onClick={save}
        disabled={isPending}
        className="rounded-md bg-teal-600 px-2 py-1 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
      >
        {saved ? '✓' : 'Save'}
      </button>
    </div>
  )
}

export default function ResultEditor({ matches }: { matches: EditableMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400 dark:text-slate-500">
        Every group-stage match has a result — nothing left to predict. 🎉
      </p>
    )
  }

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <summary className="cursor-pointer select-none font-bold text-slate-900 dark:text-white">
        ✏️ Enter actual results ({matches.length} to go)
      </summary>
      <p className="mt-1 mb-2 text-xs text-slate-500 dark:text-slate-400">
        Scores start on our prediction. Type what really happened and tap Save —
        the tables and predictions update instantly.
      </p>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {matches.map((m) => (
          <MatchRow key={`${m.group}-${m.homeName}-${m.awayName}`} match={m} />
        ))}
      </div>
    </details>
  )
}
