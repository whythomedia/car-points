'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorldCupKoResult } from '@/app/actions'
import TeamFlag from '../TeamFlag'

export type EditableKoMatch = {
  no: number
  roundTag: string
  homeName: string
  homeFlag: string
  awayName: string
  awayFlag: string
}

function MatchRow({ match }: { match: EditableKoMatch }) {
  const router = useRouter()
  const [ga, setGa] = useState('')
  const [gb, setGb] = useState('')
  const [adv, setAdv] = useState<'home' | 'away' | undefined>(undefined)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dirty = ga !== '' && gb !== ''
  const level = dirty && Number(ga) === Number(gb)
  const canSave = dirty && (!level || !!adv)

  function save() {
    if (!canSave) return
    startTransition(async () => {
      await saveWorldCupKoResult(match.no, Number(ga), Number(gb), level ? adv : undefined)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 1500)
    })
  }

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-9 shrink-0 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          M{match.no}
        </span>
        <span className="flex flex-1 items-center justify-end gap-1.5 text-right text-slate-700 dark:text-slate-200">
          {match.homeName} <TeamFlag name={match.homeName} emoji={match.homeFlag} size={18} />
        </span>
        <input
          inputMode="numeric"
          value={ga}
          placeholder="–"
          onChange={(e) => setGa(e.target.value.replace(/\D/g, '').slice(0, 2))}
          className="w-9 rounded-md border border-slate-200 bg-white py-1 text-center text-slate-900 placeholder-slate-300 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
        />
        <span className="text-slate-400">–</span>
        <input
          inputMode="numeric"
          value={gb}
          placeholder="–"
          onChange={(e) => setGb(e.target.value.replace(/\D/g, '').slice(0, 2))}
          className="w-9 rounded-md border border-slate-200 bg-white py-1 text-center text-slate-900 placeholder-slate-300 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
        />
        <span className="flex flex-1 items-center gap-1.5 text-left text-slate-700 dark:text-slate-200">
          <TeamFlag name={match.awayName} emoji={match.awayFlag} size={18} /> {match.awayName}
        </span>
        <button
          onClick={save}
          disabled={isPending || !canSave}
          className="rounded-md bg-teal-600 px-2 py-1 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-40"
        >
          {saved ? '✓' : 'Save'}
        </button>
      </div>

      {level && (
        <div className="mt-1.5 flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500">Pens:</span>
          {(['home', 'away'] as const).map((side) => {
            const name = side === 'home' ? match.homeName : match.awayName
            const active = adv === side
            return (
              <button
                key={side}
                type="button"
                onClick={() => setAdv(side)}
                className={`rounded-md border px-2 py-0.5 font-bold transition ${
                  active
                    ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    : 'border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-400'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function KoResultEditor({ matches }: { matches: EditableKoMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400 dark:text-slate-500">
        No matches ready to score yet — waiting on earlier results. ⏳
      </p>
    )
  }

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <summary className="cursor-pointer select-none font-bold text-slate-900 dark:text-white">
        ✏️ Enter knockout results ({matches.length} ready)
      </summary>
      <p className="mt-1 mb-2 text-xs text-slate-500 dark:text-slate-400">
        Type the score and tap Save — the winner drops into the next match automatically. If the
        score is level, pick who won on penalties.
      </p>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {matches.map((m) => (
          <MatchRow key={m.no} match={m} />
        ))}
      </div>
    </details>
  )
}
