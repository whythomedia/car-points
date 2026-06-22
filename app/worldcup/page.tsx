import Link from 'next/link'
import { getGroupsWithResults } from '@/lib/worldcup/store'
import {
  advancement,
  predictMatch,
  projectTournament,
  type Advancement,
  type Standing,
} from '@/lib/worldcup/predict'
import ResultEditor, { type EditableMatch } from './ResultEditor'

export const metadata = {
  title: 'World Cup 2026 — Predictions',
}

const ADV_CHIP: Record<Advancement, { label: string; className: string }> = {
  auto: {
    label: 'Through',
    className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  },
  'third-in': {
    label: '3rd ✓',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  'third-out': {
    label: '3rd ✗',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  eliminated: {
    label: 'Out',
    className: 'bg-slate-100 text-slate-400 dark:bg-slate-700/60 dark:text-slate-500',
  },
}

function StandingRow({
  s,
  adv,
}: {
  s: Standing
  adv: Advancement
}) {
  const chip = ADV_CHIP[adv]
  const dim = adv === 'eliminated' ? 'opacity-60' : ''
  return (
    <div className={`flex items-center gap-2 py-1.5 text-sm ${dim}`}>
      <span className="w-4 text-center font-bold text-slate-400 dark:text-slate-500">{s.rank}</span>
      <span className="text-lg">{s.team.flag}</span>
      <span className="flex-1 font-semibold text-slate-900 dark:text-white">{s.team.name}</span>
      <span className="w-12 text-right tabular-nums text-slate-400 dark:text-slate-500">
        {s.gd >= 0 ? '+' : ''}
        {s.gd}
      </span>
      <span className="w-7 text-right font-black tabular-nums text-slate-900 dark:text-white">{s.points}</span>
      <span className={`w-16 rounded-full px-2 py-0.5 text-center text-xs font-bold ${chip.className}`}>
        {chip.label}
      </span>
    </div>
  )
}

const CONF_STYLE: Record<string, string> = {
  'Toss-up': 'text-slate-400 dark:text-slate-500',
  Lean: 'text-slate-500 dark:text-slate-400',
  Favored: 'text-teal-600 dark:text-teal-400',
  Strong: 'text-teal-700 dark:text-teal-300',
}

export default async function WorldCupPage() {
  const groups = await getGroupsWithResults()
  const t = projectTournament(groups)

  const allMatches = t.groups.flatMap((g) => g.matches)
  const played = allMatches.filter((m) => m.played).length
  const total = allMatches.length

  const editable: EditableMatch[] = allMatches
    .filter((m) => !m.played)
    .map((m) => ({
      group: m.group,
      homeName: m.home.name,
      homeFlag: m.home.flag,
      awayName: m.away.name,
      awayFlag: m.away.flag,
      ga: m.ga,
      gb: m.gb,
    }))

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">🏆 World Cup 2026</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {played} of {total} matches played · the rest are our predictions
          </p>
        </div>
        <Link
          href="/worldcup/picks"
          className="shrink-0 rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500"
        >
          Family picks →
        </Link>
      </div>

      {/* Legend */}
      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span><strong className="text-teal-600 dark:text-teal-400">Through</strong> = top 2</span>
        <span><strong className="text-sky-600 dark:text-sky-400">3rd ✓</strong> = best-8 third place</span>
        <span><strong className="text-amber-600 dark:text-amber-400">3rd ✗</strong> = third, just misses</span>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {t.groups.map((g) => {
          const predicted = g.matches.filter((m) => !m.played)
          return (
            <div
              key={g.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-1 flex items-baseline justify-between">
                <h2 className="font-black text-slate-900 dark:text-white">Group {g.id}</h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">GD · Pts</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {g.table.map((s) => (
                  <StandingRow key={s.team.name} s={s} adv={advancement(s, t.qualifyingThirds)} />
                ))}
              </div>

              {predicted.length > 0 && (
                <div className="mt-3 border-t border-dashed border-slate-200 pt-2 dark:border-slate-600">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Predicted to come
                  </p>
                  {predicted.map((m) => {
                    const p = predictMatch(m.home, m.away)
                    return (
                      <div
                        key={`${m.home.name}-${m.away.name}`}
                        className="flex items-center gap-2 py-0.5 text-sm"
                      >
                        <span className="flex-1 text-right text-slate-600 dark:text-slate-300">
                          {m.home.name} {m.home.flag}
                        </span>
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                          {m.ga}–{m.gb}
                        </span>
                        <span className="flex-1 text-left text-slate-600 dark:text-slate-300">
                          {m.away.flag} {m.away.name}
                        </span>
                        <span className={`w-16 text-right text-xs font-semibold ${CONF_STYLE[p.confidence]}`}>
                          {p.confidence}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Best third-placed race */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-1 font-black text-slate-900 dark:text-white">Best third-placed race</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Eight of these twelve sneak into the round of 32.
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {t.thirdsRace.map((s, i) => {
            const inSet = t.qualifyingThirds.has(s.team.name)
            return (
              <div
                key={s.team.name}
                className={`flex items-center gap-2 py-1.5 text-sm ${inSet ? '' : 'opacity-60'}`}
              >
                <span className="w-4 text-center font-bold text-slate-400 dark:text-slate-500">{i + 1}</span>
                <span className="text-lg">{s.team.flag}</span>
                <span className="flex-1 font-semibold text-slate-900 dark:text-white">
                  {s.team.name}
                  <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
                    Grp {s.group}
                  </span>
                </span>
                <span className="w-12 text-right tabular-nums text-slate-400 dark:text-slate-500">
                  {s.gd >= 0 ? '+' : ''}
                  {s.gd}
                </span>
                <span className="w-7 text-right font-black tabular-nums text-slate-900 dark:text-white">{s.points}</span>
                <span
                  className={`w-16 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                    inSet ? ADV_CHIP['third-in'].className : ADV_CHIP['third-out'].className
                  }`}
                >
                  {inSet ? 'In' : 'Out'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Result entry */}
      <div className="mt-6">
        <ResultEditor matches={editable} />
      </div>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Predictions use a simple power-rating model. Tiebreakers: points, then
        goal difference, then goals scored.
      </p>
    </div>
  )
}
