'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveWorldCupKoPick, saveWorldCupPick } from '@/app/actions'
import { textOn, type Predictor } from '@/lib/worldcup/brand'
import { scoreKoPick, scorePick, type AllPicks, type LeaderRow, type Pick } from '@/lib/worldcup/picks'
import TeamFlag from './TeamFlag'

export type PickMatch = {
  matchId: string
  no: number
  date: string // ISO YYYY-MM-DD
  stage: 'group' | 'ko'
  // group stage
  group?: string
  groupColor?: string
  // knockout stage
  roundLabel?: string // e.g. "R16", "Final"
  roundColor?: string
  homeName: string
  homeFlag: string
  awayName: string
  awayFlag: string
  played: boolean
  ga: number // actual score when played; unused otherwise
  gb: number
  advanced?: 'home' | 'away' // knockout, when played (who went through)
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
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-black"
      style={{ backgroundColor: color, color: textOn(color) }}
    >
      {group}
    </span>
  )
}

// Group letter for group matches; round tag (R16, Final…) for knockout matches.
function StageChip({ match }: { match: PickMatch }) {
  if (match.stage === 'ko') {
    const color = match.roundColor ?? '#64748B'
    return (
      <span
        className="inline-flex h-5 shrink-0 items-center justify-center rounded px-1.5 text-[10px] font-black"
        style={{ backgroundColor: color, color: textOn(color) }}
      >
        {match.roundLabel}
      </span>
    )
  }
  return <GroupChip group={match.group!} color={match.groupColor!} />
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

function byDay(matches: PickMatch[]): [string, PickMatch[]][] {
  const map = new Map<string, PickMatch[]>()
  for (const m of matches) {
    const arr = map.get(m.date) ?? []
    arr.push(m)
    map.set(m.date, arr)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, ms]) => [date, ms.sort((x, y) => x.no - y.no)])
}

function formatDay(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Compact, tappable summary row — editing happens in the modal.
function UpcomingRow({
  match,
  pick,
  onOpen,
}: {
  match: PickMatch
  pick?: { ga: number; gb: number }
  onOpen: () => void
}) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-2 py-2.5 text-left text-sm">
      <StageChip match={match} />
      <span className="flex flex-1 items-center justify-end gap-1.5 text-right leading-tight text-slate-700 dark:text-slate-200">
        {match.homeName} <TeamFlag name={match.homeName} emoji={match.homeFlag} size={18} />
      </span>
      <span className="w-14 shrink-0 text-center">
        {pick ? (
          <span className="font-black tabular-nums text-slate-900 dark:text-white">
            {pick.ga}–{pick.gb}
          </span>
        ) : (
          <span className="font-bold text-teal-600 dark:text-teal-400">Pick</span>
        )}
      </span>
      <span className="flex flex-1 items-center gap-1.5 text-left leading-tight text-slate-700 dark:text-slate-200">
        <TeamFlag name={match.awayName} emoji={match.awayFlag} size={18} /> {match.awayName}
      </span>
      <svg className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// Completed row shows only the signed-in user's pick + points (no pill soup).
function CompletedRow({
  match,
  user,
  picks,
}: {
  match: PickMatch
  user: Predictor
  picks: AllPicks
}) {
  const actual = { ga: match.ga, gb: match.gb }
  const isKo = match.stage === 'ko'
  const winner = isKo
    ? match.advanced ?? 'draw'
    : match.ga > match.gb
      ? 'home'
      : match.gb > match.ga
        ? 'away'
        : 'draw'
  const p = picks[match.matchId]?.[user.name]
  const pts = p ? (isKo ? scoreKoPick(p, actual, match.advanced!) : scorePick(p, actual)) : null

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center gap-2">
        <StageChip match={match} />
        <span className={`flex flex-1 items-center justify-end gap-1.5 text-right leading-tight ${winner === 'home' ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
          {match.homeName} <TeamFlag name={match.homeName} emoji={match.homeFlag} size={18} />
        </span>
        <span className="shrink-0 rounded bg-slate-900 px-2 py-0.5 font-black tabular-nums text-white dark:bg-slate-200 dark:text-slate-900">
          {match.ga}–{match.gb}
        </span>
        <span className={`flex flex-1 items-center gap-1.5 text-left leading-tight ${winner === 'away' ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
          <TeamFlag name={match.awayName} emoji={match.awayFlag} size={18} /> {match.awayName}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
        {p ? (
          <>
            <span style={{ color: user.color }} className="font-bold">{user.name}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{p.ga}–{p.gb}</span>
            <PointChip pts={pts!} />
          </>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">no pick</span>
        )}
      </div>
    </div>
  )
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const btn =
    'flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-700 active:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:active:bg-slate-600'
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={() => onChange(Math.min(20, value + 1))} className={btn} aria-label="increase">
        +
      </button>
      <span className="w-12 text-center text-3xl font-black tabular-nums text-slate-900 dark:text-white">{value}</span>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className={btn} aria-label="decrease">
        −
      </button>
    </div>
  )
}

function TeamCol({ name, flag }: { name: string; flag: string }) {
  return (
    <div className="flex w-20 flex-col items-center gap-2 text-center">
      <TeamFlag name={name} emoji={flag} size={52} />
      <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{name}</span>
    </div>
  )
}

function PickModal({
  match,
  user,
  savedPick,
  otherPickers,
  onClose,
}: {
  match: PickMatch
  user: Predictor
  savedPick?: Pick
  otherPickers: string[]
  onClose: () => void
}) {
  const router = useRouter()
  const [ga, setGa] = useState(savedPick?.ga ?? 0)
  const [gb, setGb] = useState(savedPick?.gb ?? 0)
  const [adv, setAdv] = useState<'home' | 'away' | undefined>(savedPick?.adv)
  const [isPending, startTransition] = useTransition()

  const isKo = match.stage === 'ko'
  // Knockouts can't end level — if they predict a tie, ask who goes through.
  const needAdvancer = isKo && ga === gb
  const canSave = !needAdvancer || !!adv

  function save() {
    if (!canSave) return
    startTransition(async () => {
      if (isKo) {
        await saveWorldCupKoPick(match.no, user.name, ga, gb, needAdvancer ? adv : undefined)
      } else {
        await saveWorldCupPick(match.matchId, user.name, ga, gb)
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-8 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-600" />
        <div className="mb-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <StageChip match={match} />
          <span>{isKo ? match.roundLabel : `Group ${match.group}`} · {formatDay(match.date)}</span>
        </div>
        <p className="mb-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Playing as <strong style={{ color: user.color }}>{user.name}</strong>
        </p>

        <div className="flex items-start justify-center gap-3">
          <TeamCol name={match.homeName} flag={match.homeFlag} />
          <div className="pt-3">
            <Stepper value={ga} onChange={setGa} />
          </div>
          <div className="pt-3">
            <Stepper value={gb} onChange={setGb} />
          </div>
          <TeamCol name={match.awayName} flag={match.awayFlag} />
        </div>

        {needAdvancer && (
          <div className="mt-5">
            <p className="mb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              Level after 120′ — who wins on penalties?
            </p>
            <div className="flex gap-2">
              {(['home', 'away'] as const).map((side) => {
                const name = side === 'home' ? match.homeName : match.awayName
                const active = adv === side
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setAdv(side)}
                    className={`flex-1 rounded-xl border-2 px-2 py-2 text-sm font-bold transition ${
                      active
                        ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={save}
          disabled={isPending || !canSave}
          className="mt-7 w-full rounded-2xl bg-teal-600 py-3.5 font-black text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : !canSave ? 'Pick who advances' : savedPick ? 'Update pick' : 'Save pick'}
        </button>

        {otherPickers.length > 0 && (
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            {otherPickers.join(', ')} {otherPickers.length === 1 ? 'has' : 'have'} already picked
          </p>
        )}
      </div>
    </div>
  )
}

export default function PicksClient({ users, matches, picks, leaderboard }: Props) {
  const [user, setUser] = useState<Predictor>(users[0])
  const [editing, setEditing] = useState<PickMatch | null>(null)

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
              <span className="w-4 text-center text-sm font-bold text-slate-400 dark:text-slate-500">{i + 1}</span>
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
        <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Who&apos;s picking?</p>
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
          Playing as <strong style={{ color: user.color }}>{user.name}</strong>. Tap a match to
          predict the score.
        </p>
        {upcoming.length === 0 ? (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500">
            Nothing to pick right now — check back when the next round is set. 🎉
          </p>
        ) : (
          <div className="space-y-4">
            {byDay(upcoming).map(([date, ms]) => (
              <div
                key={date}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-1 font-bold text-slate-900 dark:text-white">{formatDay(date)}</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {ms.map((m) => (
                    <UpcomingRow
                      key={m.matchId}
                      match={m}
                      pick={picks[m.matchId]?.[user.name]}
                      onOpen={() => setEditing(m)}
                    />
                  ))}
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
            {byDay(completed).map(([date, ms]) => (
              <div
                key={date}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-1 font-bold text-slate-900 dark:text-white">{formatDay(date)}</div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {ms.map((m) => (
                    <CompletedRow key={m.matchId} match={m} user={user} picks={picks} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <PickModal
          key={`${user.name}-${editing.matchId}`}
          match={editing}
          user={user}
          savedPick={picks[editing.matchId]?.[user.name]}
          otherPickers={users
            .filter((u) => u.name !== user.name && picks[editing.matchId]?.[u.name])
            .map((u) => u.name)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
