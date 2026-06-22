'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorldCupPick } from '@/app/actions'
import { textOn, type Predictor } from '@/lib/worldcup/brand'
import { scorePick, type AllPicks, type LeaderRow } from '@/lib/worldcup/picks'
import TeamFlag from '../TeamFlag'

export type PickMatch = {
  matchId: string
  group: string
  groupColor: string
  homeName: string
  homeFlag: string
  awayName: string
  awayFlag: string
  played: boolean
  ga: number // actual if played, else model prediction (a hint)
  gb: number
}

type Props = {
  users: Predictor[]
  matches: PickMatch[]
  picks: AllPicks
  leaderboard: LeaderRow[]
}

const STORAGE_KEY = 'wc-pick-user'

function GroupChip({ group, color }: { group: string; color: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-black"
      style={{ backgroundColor: color, color: textOn(color) }}
    >
      {group}
    </span>
  )
}

function PointChip({ pts }: { pts: 0 | 1 | 3 }) {
  const style =
    pts === 3
      ? 'bg-teal-600 text-white'
      : pts === 1
        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
        : 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500'
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-black tabular-nums ${style}`}>
      {pts > 0 ? `+${pts}` : '0'}
    </span>
  )
}

function UpcomingRow({
  match,
  user,
  savedPick,
  pickedColors,
}: {
  match: PickMatch
  user: Predictor
  savedPick?: { ga: number; gb: number }
  pickedColors: string[]
}) {
  const router = useRouter()
  const [ga, setGa] = useState(savedPick ? String(savedPick.ga) : '')
  const [gb, setGb] = useState(savedPick ? String(savedPick.gb) : '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dirty = ga !== '' && gb !== ''

  function save() {
    if (!dirty) return
    startTransition(async () => {
      await saveWorldCupPick(match.matchId, user.name, Number(ga), Number(gb))
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
      <span className="flex w-8 justify-center gap-0.5">
        {pickedColors.map((c, i) => (
          <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </span>
      <button
        onClick={save}
        disabled={isPending || !dirty}
        className="w-12 rounded-md bg-teal-600 px-2 py-1 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-40"
      >
        {saved ? '✓' : savedPick ? 'Edit' : 'Pick'}
      </button>
    </div>
  )
}

function CompletedRow({
  match,
  users,
  picks,
}: {
  match: PickMatch
  users: Predictor[]
  picks: AllPicks
}) {
  const actual = { ga: match.ga, gb: match.gb }
  const winner =
    match.ga > match.gb ? 'home' : match.gb > match.ga ? 'away' : 'draw'
  const matchPicks = picks[match.matchId] ?? {}

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`flex flex-1 items-center justify-end gap-1.5 text-right ${winner === 'home' ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          {match.homeName} <TeamFlag name={match.homeName} emoji={match.homeFlag} size={18} />
        </span>
        <span className="rounded bg-slate-900 px-2 py-0.5 font-black tabular-nums text-white dark:bg-slate-200 dark:text-slate-900">
          {match.ga}–{match.gb}
        </span>
        <span
          className={`flex flex-1 items-center gap-1.5 text-left ${winner === 'away' ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          <TeamFlag name={match.awayName} emoji={match.awayFlag} size={18} /> {match.awayName}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {users.map((u) => {
          const p = matchPicks[u.name]
          if (!p) {
            return (
              <span
                key={u.name}
                className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-300 dark:bg-slate-700/40 dark:text-slate-500"
              >
                {u.name} —
              </span>
            )
          }
          const pts = scorePick(p, actual)
          return (
            <span
              key={u.name}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: u.color, color: textOn(u.color) }}
            >
              {u.name} {p.ga}–{p.gb}
              <span className="ml-0.5">
                <PointChip pts={pts} />
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function byGroup(matches: PickMatch[]) {
  const map = new Map<string, PickMatch[]>()
  for (const m of matches) {
    const arr = map.get(m.group) ?? []
    arr.push(m)
    map.set(m.group, arr)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export default function PicksClient({ users, matches, picks, leaderboard }: Props) {
  const [user, setUser] = useState<Predictor>(users[0])

  // Restore the last picker after mount. Deferred so the first client render
  // matches the server (users[0]) — no hydration mismatch, no cascading render.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const found = users.find((u) => u.name === saved)
    if (found) queueMicrotask(() => setUser(found))
  }, [users])

  function selectUser(u: Predictor) {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, u.name)
  }

  const upcoming = matches.filter((m) => !m.played)
  const completed = matches.filter((m) => m.played)

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-2 font-black text-slate-900 dark:text-white">🏅 Leaderboard</h2>
        <div className="space-y-1">
          {leaderboard.map((r, i) => (
            <div
              key={r.name}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${r.name === user.name ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
            >
              <span className="w-4 text-center text-sm font-bold text-slate-400 dark:text-slate-500">
                {i + 1}
              </span>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="flex-1 font-bold text-slate-900 dark:text-white">{r.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {r.exact} exact · {r.correct} winners
              </span>
              <span className="w-10 text-right text-lg font-black tabular-nums text-slate-900 dark:text-white">
                {r.points}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
          Exact score = 3 pts · correct winner = 1 pt
        </p>
      </div>

      {/* Who are you */}
      <div>
        <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Who&apos;s picking?
        </p>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const active = u.name === user.name
            return (
              <button
                key={u.name}
                onClick={() => selectUser(u)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? '' : 'opacity-50'}`}
                style={{ backgroundColor: u.color, color: textOn(u.color) }}
              >
                {u.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Upcoming — make picks */}
      <div>
        <h2 className="mb-1 font-black text-slate-900 dark:text-white">
          Your picks
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
            {upcoming.length} matches to play
          </span>
        </h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Playing as <strong style={{ color: user.color }}>{user.name}</strong>. Type your
          score and tap Pick. Dots show who else has locked a pick (scores stay hidden
          until kickoff).
        </p>
        {upcoming.length === 0 ? (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500">
            Every group match has kicked off — see the results below. 🎉
          </p>
        ) : (
          <div className="space-y-4">
            {byGroup(upcoming).map(([group, ms]) => (
              <div
                key={group}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-1 flex items-center gap-2">
                  <GroupChip group={group} color={ms[0].groupColor} />
                  <span className="font-bold text-slate-900 dark:text-white">Group {group}</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {ms.map((m) => {
                    const pickers = picks[m.matchId] ?? {}
                    const pickedColors = users
                      .filter((u) => pickers[u.name])
                      .map((u) => u.color)
                    return (
                      <UpcomingRow
                        key={`${user.name}-${m.matchId}`}
                        match={m}
                        user={user}
                        savedPick={pickers[user.name]}
                        pickedColors={pickedColors}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed — results & points */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-3 font-black text-slate-900 dark:text-white">
            Results &amp; points
            <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
              {completed.length} played
            </span>
          </h2>
          <div className="space-y-4">
            {byGroup(completed).map(([group, ms]) => (
              <div
                key={group}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-1 flex items-center gap-2">
                  <GroupChip group={group} color={ms[0].groupColor} />
                  <span className="font-bold text-slate-900 dark:text-white">Group {group}</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {ms.map((m) => (
                    <CompletedRow key={m.matchId} match={m} users={users} picks={picks} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
