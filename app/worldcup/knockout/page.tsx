import Link from 'next/link'
import { getKoResults } from '@/lib/worldcup/ko-store'
import { ROUND_META, resolveBracket, type ResolvedMatch, type Round } from '@/lib/worldcup/bracket'
import TeamFlag from '../TeamFlag'
import KoResultEditor, { type EditableKoMatch } from './KoResultEditor'

export const metadata = {
  title: 'World Cup 2026 — Knockout Bracket',
}

const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', '3rd', 'Final']

function formatDay(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function TeamLine({
  name,
  flag,
  label,
  score,
  isWinner,
  played,
}: {
  name: string | null
  flag: string | null
  label: string
  score: number | null
  isWinner: boolean
  played: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {name ? (
        <TeamFlag name={name} emoji={flag ?? undefined} size={20} />
      ) : (
        <span className="h-5 w-5 shrink-0 rounded-full border border-dashed border-slate-300 dark:border-slate-600" />
      )}
      <span
        className={`flex-1 truncate ${
          name
            ? isWinner
              ? 'font-black text-slate-900 dark:text-white'
              : played
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-700 dark:text-slate-200'
            : 'italic text-slate-400 dark:text-slate-500'
        }`}
      >
        {name ?? label}
      </span>
      {played && (
        <span className={`tabular-nums ${isWinner ? 'font-black text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function MatchCard({ m }: { m: ResolvedMatch }) {
  const pens = m.played && m.ga === m.gb
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="font-semibold">
          M{m.no} · {formatDay(m.date)} · {m.time.replace(' CDT', '')}
        </span>
        <span className="truncate">{m.venue}</span>
      </div>
      <TeamLine
        name={m.home}
        flag={m.homeFlag}
        label={m.homeLabel}
        score={m.ga}
        isWinner={m.advanced === 'home'}
        played={m.played}
      />
      <TeamLine
        name={m.away}
        flag={m.awayFlag}
        label={m.awayLabel}
        score={m.gb}
        isWinner={m.advanced === 'away'}
        played={m.played}
      />
      {pens && (
        <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">
          {m.winner} won on penalties
        </p>
      )}
    </div>
  )
}

export default async function KnockoutPage() {
  const koResults = await getKoResults()
  const resolved = resolveBracket(koResults)
  const byNo = new Map(resolved.map((m) => [m.no, m]))
  const champion = byNo.get(104)?.winner ?? null

  const editable: EditableKoMatch[] = resolved
    .filter((m) => m.home && m.away && !m.played)
    .map((m) => ({
      no: m.no,
      roundTag: ROUND_META[m.round].tag,
      homeName: m.home!,
      homeFlag: m.homeFlag ?? '🏴',
      awayName: m.away!,
      awayFlag: m.awayFlag ?? '🏴',
    }))

  return (
      <div className="min-h-screen px-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">🏆 Knockout Bracket</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Round of 32 → Final</p>
          </div>
          <Link
            href="/worldcup"
            className="shrink-0 rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500"
          >
            ⚽ Picks →
          </Link>
        </div>

        {champion && (
          <div className="mb-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center dark:border-amber-500 dark:bg-amber-900/30">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">World Champions</p>
            <p className="text-xl font-black text-amber-900 dark:text-amber-200">🏆 {champion}</p>
          </div>
        )}

        <div className="space-y-5">
          {ROUND_ORDER.map((round) => {
            const ms = resolved.filter((m) => m.round === round)
            const meta = ROUND_META[round]
            return (
              <div key={round}>
                <h2 className="mb-2 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                  <span
                    className="inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] font-black text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.tag}
                  </span>
                  {meta.label}
                </h2>
                <div className="space-y-2">
                  {ms.map((m) => (
                    <MatchCard key={m.no} m={m} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6">
          <KoResultEditor matches={editable} />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Winners flow into the next match automatically. Make your predictions on the{' '}
          <Link href="/worldcup" className="font-semibold text-teal-600 dark:text-teal-400">
            Picks
          </Link>{' '}
          page.
        </p>
      </div>
    )
}
