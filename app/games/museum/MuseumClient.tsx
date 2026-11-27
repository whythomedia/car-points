'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { resetMuseumGame, saveMuseumGame } from '@/app/actions'
import * as Engine from '@/lib/games/museum/engine.mjs'
import type { MuseumState } from '@/lib/games/museum/engine.mjs'
import { MUSEUM_BONUS, puzzleByTreasure } from '@/lib/games/museum/puzzles'

// The whole game runs here in the browser (see lib/games/museum/engine.mjs),
// so it keeps working offline. Every tap is saved on this device right away,
// and to Redis a moment later so the game follows the player to another device.

type Save = { state: MuseumState; savedAt: string }

const SAVE_DELAY_MS = 1500

function localKey(person: string) {
  return `museum:save:${person}`
}
function readLocal(person: string): Save | null {
  try {
    const raw = localStorage.getItem(localKey(person))
    const save = raw ? (JSON.parse(raw) as Save) : null
    return save && save.state && typeof save.state.id === 'string' ? save : null
  } catch {
    return null
  }
}
function writeLocal(person: string, state: MuseumState) {
  try {
    localStorage.setItem(localKey(person), JSON.stringify({ state, savedAt: new Date().toISOString() }))
  } catch {
    // storage unavailable: the Redis save still happens
  }
}

// Whichever copy was saved last wins: this device's or the one from Redis.
function loadGame(person: string, server: Save | null): MuseumState {
  const local = readLocal(person)
  const newest = local && server ? (local.savedAt >= server.savedAt ? local : server) : (local ?? server)
  return newest ? Engine.normalize(newest.state) : Engine.newState()
}

function copy(state: MuseumState): MuseumState {
  return JSON.parse(JSON.stringify(state)) as MuseumState
}

const subscribeNever = () => () => {}

export default function MuseumClient({
  person,
  isKid,
  saved,
}: {
  person: string
  isKid: boolean
  saved: Save | null
}) {
  // False on the server and during hydration, true after: the saved game on
  // this device can only be read in the browser.
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false)
  const initial = useMemo(
    () => (inBrowser ? loadGame(person, saved) : null),
    [inBrowser, person, saved]
  )
  const [played, setPlayed] = useState<MuseumState | null>(null)
  const state = played ?? initial

  const [hour, setHour] = useState('')
  const [bonus, setBonus] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const latest = useRef<MuseumState | null>(null)
  const unsaved = useRef(false)
  const saving = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Send the newest state to Redis. One request at a time; a failure (offline)
  // leaves it marked unsaved and it goes out with the next tap or reconnect.
  async function pushSave() {
    if (saving.current || !unsaved.current || !latest.current) return
    saving.current = true
    unsaved.current = false
    try {
      const res = await saveMuseumGame(latest.current)
      if (!res.ok) unsaved.current = true
      if (res.awarded.length) {
        const names = res.awarded.map((t) => puzzleByTreasure(t)?.label ?? t).join(' and ')
        setBonus(`+${MUSEUM_BONUS * res.awarded.length} points for finishing ${names}!`)
      }
    } catch {
      unsaved.current = true
    } finally {
      saving.current = false
    }
  }

  function commit(next: MuseumState) {
    latest.current = next
    unsaved.current = true
    writeLocal(person, next)
    setPlayed(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(pushSave, SAVE_DELAY_MS)
  }

  // Save promptly when the app is put away, and catch up when a connection returns.
  useEffect(() => {
    const flush = () => {
      if (timer.current) clearTimeout(timer.current)
      void pushSave()
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('online', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('online', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
    // pushSave only reads refs, so one subscription for the life of the page is right.
  }, [])

  if (!state) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" aria-hidden />
  }

  const view = Engine.view(state)

  function pick(index: number) {
    if (!state) return
    setBonus(null)
    setConfirmReset(false)
    setHour('')
    commit(Engine.choose(copy(state), index))
    window.scrollTo(0, 0)
  }

  function submitHour(e: React.FormEvent) {
    e.preventDefault()
    if (!state) return
    setBonus(null)
    commit(Engine.submit(copy(state), hour))
    setHour('')
    window.scrollTo(0, 0)
  }

  function startOver() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    setConfirmReset(false)
    setBonus(null)
    void resetMuseumGame().catch(() => {})
    commit(Engine.newState())
    window.scrollTo(0, 0)
  }

  const prose = 'text-[17px] leading-relaxed text-slate-800 dark:text-slate-100'

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
        {view.heading}
      </h2>

      {bonus && (
        <p className="rounded-2xl bg-teal-100 px-4 py-3 text-sm font-black text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
          {bonus}
        </p>
      )}

      {view.msg.length > 0 && (
        <div
          aria-live="polite"
          className="space-y-3 rounded-2xl border-l-4 border-teal-500 bg-white p-4 shadow-sm dark:bg-slate-800"
        >
          {view.msg.map((line, i) => (
            <p key={i} className={prose}>
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {view.text.map((line, i) => (
          <p key={i} className={prose}>
            {line}
          </p>
        ))}
      </div>

      {view.input && (
        <form onSubmit={submitHour} className="space-y-2">
          <label htmlFor="museum-hour" className="block text-sm font-bold text-slate-500 dark:text-slate-400">
            {view.input.label}
          </label>
          <input
            id="museum-hour"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            autoComplete="off"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            placeholder="1 to 12"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-teal-600 px-4 py-3 text-base font-black text-white active:bg-teal-700"
          >
            Set the hands
          </button>
        </form>
      )}

      <div className="space-y-2">
        {view.options.map((label, i) => (
          <button
            key={`${i}-${label}`}
            type="button"
            onClick={() => pick(i)}
            className="flex w-full items-baseline gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-bold text-slate-900 transition-colors active:border-teal-400 active:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:active:bg-slate-700"
          >
            <span className="w-5 shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">You are carrying: {view.carrying}.</p>
        <button
          type="button"
          onClick={startOver}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 dark:border-slate-600 dark:text-slate-400"
        >
          {confirmReset ? 'Tap again to start over' : 'Start over'}
        </button>
        {!isKid && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Parents can play, but only kids earn points.
          </p>
        )}
      </div>
    </div>
  )
}
