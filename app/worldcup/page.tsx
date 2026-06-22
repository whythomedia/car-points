import Link from 'next/link'
import { getGroupsWithResults } from '@/lib/worldcup/store'
import { analyzeTournament, groupMatches, type Bucket, type Standing } from '@/lib/worldcup/predict'
import { GROUP_COLORS, textOn } from '@/lib/worldcup/brand'
import TeamFlag from './TeamFlag'
import ResultEditor, { type EditableMatch } from './ResultEditor'

export const metadata = {
  title: 'World Cup 2026 — Standings',
}

const BUCKET: Record<Bucket, { label: string; className: string }> = {
  through: {
    label: 'Through',
    className: 'bg-teal-600 text-white',
  },
  'likely-through': {
    label: 'Likely through',
    className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  },
  'likely-out': {
    label: 'Likely out',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  out: {
    label: 'Out',
    className: 'bg-slate-200 text-slate-500 dark:bg-slate-700/70 dark:text-slate-400',
  },
}

function StandingRow({ s, bucket }: { s: Standing; bucket: Bucket }) {
  const chip = BUCKET[bucket]
  const dim = bucket === 'out' ? 'opacity-60' : ''
  return (
    <div className={`flex items-center gap-2 py-1.5 text-sm ${dim}`}>
      <span className="w-4 text-center font-bold text-slate-400 dark:text-slate-500">{s.rank}</span>
      <TeamFlag name={s.team.name} emoji={s.team.flag} size={22} />
      <span className="flex-1 truncate font-semibold text-slate-900 dark:text-white">{s.team.name}</span>
      <span className="w-7 text-right tabular-nums text-slate-400 dark:text-slate-500">
        {s.gd >= 0 ? '+' : ''}
        {s.gd}
      </span>
      <span className="w-6 text-right font-black tabular-nums text-slate-900 dark:text-white">{s.points}</span>
      <span className={`w-24 rounded-full px-2 py-0.5 text-center text-[11px] font-bold ${chip.className}`}>
        {chip.label}
      </span>
    </div>
  )
}

export default async function WorldCupPage() {
  const groups = await getGroupsWithResults()
  const { groups: analysis } = analyzeTournament(groups)

  const allMatches = groups.flatMap((g) => groupMatches(g))
  const played = allMatches.filter((m) => m.played).length

  const editable: EditableMatch[] = allMatches
    .filter((m) => !m.played)
    .map((m) => ({
      group: m.group,
      homeName: m.home.name,
      homeFlag: m.home.flag,
      awayName: m.away.name,
      awayFlag: m.away.flag,
    }))

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">🏆 World Cup 2026</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{played} of 72 group matches played</p>
        </div>
        <Link
          href="/worldcup/picks"
          className="shrink-0 rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500"
        >
          Family picks →
        </Link>
      </div>

      {/* Legend */}
      <div className="mb-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span><strong className="text-teal-600 dark:text-teal-400">Through</strong> / <strong className="text-amber-600 dark:text-amber-400">Out</strong> = clinched</span>
        <span><strong>Likely</strong> = our projection of the rest</span>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {analysis.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-xs font-black"
                  style={{ backgroundColor: GROUP_COLORS[g.id], color: textOn(GROUP_COLORS[g.id]) }}
                >
                  {g.id}
                </span>
                Group {g.id}
              </h2>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">GD · Pts</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {g.table.map((s) => (
                <StandingRow key={s.team.name} s={s} bucket={g.buckets.get(s.team.name)!} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Result entry */}
      <div className="mt-6">
        <ResultEditor matches={editable} />
      </div>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Confirmed from results played; &ldquo;likely&rdquo; uses a power-rating projection of the
        remaining games. Top 2 of each group plus the 8 best third-placed teams advance.
      </p>
    </div>
  )
}
