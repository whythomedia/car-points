'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleStateSpotted } from '@/app/actions'
import type { State } from '@/lib/games/states'

function StateIcon({ state, dim }: { state: State; dim: boolean }) {
  if (state.flag) {
    return (
      <Image
        src={`/stateflags/${state.slug}.png`}
        alt={state.name}
        width={44}
        height={44}
        className={`h-11 w-11 rounded-lg object-cover ring-1 ring-black/10 transition dark:ring-white/10 ${dim ? 'opacity-40 grayscale' : ''}`}
      />
    )
  }
  // No icon for this state — show an abbreviation badge instead.
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black ring-1 ring-black/10 transition dark:ring-white/10 ${
        dim
          ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
      }`}
    >
      {state.abbr}
    </span>
  )
}

function StateButton({ state, isSeen, onSelect }: { state: State; isSeen: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition ${
        isSeen
          ? 'border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/30'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <StateIcon state={state} dim={!isSeen} />
      <span className={`text-[11px] font-bold leading-tight ${isSeen ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}>
        {state.name}
      </span>
      {isSeen && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-black text-white shadow">
          ✓
        </span>
      )}
    </button>
  )
}

export default function PlatesClient({
  states,
  spotted,
}: {
  states: State[]
  spotted: string[]
}) {
  const router = useRouter()
  const [seen, setSeen] = useState<Set<string>>(new Set(spotted))
  const [confirming, setConfirming] = useState<State | null>(null)
  const [, startTransition] = useTransition()

  const count = seen.size
  const total = states.length
  const toFind = states.filter((s) => !seen.has(s.slug))
  const found = states.filter((s) => seen.has(s.slug))

  function confirmToggle() {
    const state = confirming!
    const willSpot = !seen.has(state.slug)
    setSeen((prev) => {
      const next = new Set(prev)
      if (willSpot) next.add(state.slug)
      else next.delete(state.slug)
      return next
    })
    setConfirming(null)
    startTransition(async () => {
      await toggleStateSpotted(state.slug, willSpot)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
          <span>{count === total ? 'All 50 states! 🎉' : 'States spotted'}</span>
          <span className="tabular-nums">{count} / {total}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(count / total) * 100}%` }} />
        </div>
      </div>

      {/* Still to find — kept up top so the last few stand out */}
      {toFind.length > 0 ? (
        <>
          <h2 className="mb-2 flex items-baseline gap-2 font-black text-slate-900 dark:text-white">
            Still to find
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{toFind.length} left</span>
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {toFind.map((state) => (
              <StateButton key={state.slug} state={state} isSeen={false} onSelect={() => setConfirming(state)} />
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-teal-400 bg-teal-50 py-6 text-center font-black text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
          Every state found — amazing! 🎉
        </p>
      )}

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Tap a state when you spot its plate — we&apos;ll ask you to confirm.
      </p>

      {/* Found */}
      {found.length > 0 && (
        <>
          <hr className="my-5 border-slate-200 dark:border-slate-700" />
          <h2 className="mb-2 flex items-baseline gap-2 font-black text-slate-900 dark:text-white">
            Found
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{found.length}</span>
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {found.map((state) => (
              <StateButton key={state.slug} state={state} isSeen onSelect={() => setConfirming(state)} />
            ))}
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6" onClick={() => setConfirming(null)}>
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 text-center dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-center">
              <StateIcon state={confirming} dim={false} />
            </div>
            {seen.has(confirming.slug) ? (
              <>
                <p className="mb-1 text-lg font-black text-slate-900 dark:text-white">Remove {confirming.name}?</p>
                <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">This unchecks it from the board.</p>
              </>
            ) : (
              <>
                <p className="mb-1 text-lg font-black text-slate-900 dark:text-white">Spotted {confirming.name}?</p>
                <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Only check it if you really saw the plate!</p>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                className={`flex-1 rounded-xl py-3 font-black text-white ${
                  seen.has(confirming.slug) ? 'bg-red-500 hover:bg-red-400' : 'bg-teal-600 hover:bg-teal-500'
                }`}
              >
                {seen.has(confirming.slug) ? 'Remove' : 'Yes! ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
