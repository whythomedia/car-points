import Link from 'next/link'
import { GROUPS } from '@/lib/worldcup/data'
import { getResults, matchId } from '@/lib/worldcup/store'
import { getKoResults } from '@/lib/worldcup/ko-store'
import { ROUND_META, koMatchId, resolveBracket } from '@/lib/worldcup/bracket'
import { groupMatches } from '@/lib/worldcup/predict'
import { GROUP_COLORS, PREDICTORS } from '@/lib/worldcup/brand'
import { getAllPicks } from '@/lib/worldcup/picks'
import { loadCombinedLeaderboard } from '@/lib/worldcup/leaderboard'
import PicksClient, { type PickMatch } from './PicksClient'

export const metadata = {
  title: 'World Cup 2026 — Family Picks',
}

export default async function PicksPage() {
  const [results, koResults, picks, leaderboard] = await Promise.all([
    getResults(),
    getKoResults(),
    getAllPicks(),
    loadCombinedLeaderboard(),
  ])

  const groupPicks: PickMatch[] = GROUPS.flatMap((group) =>
    groupMatches(group, results).map((m) => ({
      matchId: matchId(group.id, m.home.name, m.away.name),
      no: m.no,
      date: m.date,
      stage: 'group',
      group: group.id,
      groupColor: GROUP_COLORS[group.id],
      homeName: m.home.name,
      homeFlag: m.home.flag,
      awayName: m.away.name,
      awayFlag: m.away.flag,
      played: m.played,
      ga: m.played ? m.ga : 0,
      gb: m.played ? m.gb : 0,
    }))
  )

  // Knockout matches become pickable once both teams are decided.
  const koPicks: PickMatch[] = resolveBracket(koResults)
    .filter((m) => m.home && m.away)
    .map((m) => ({
      matchId: koMatchId(m.no),
      no: m.no,
      date: m.date,
      stage: 'ko',
      roundLabel: ROUND_META[m.round].tag,
      roundColor: ROUND_META[m.round].color,
      homeName: m.home!,
      homeFlag: m.homeFlag ?? '🏴',
      awayName: m.away!,
      awayFlag: m.awayFlag ?? '🏴',
      played: m.played,
      ga: m.played ? m.ga! : 0,
      gb: m.played ? m.gb! : 0,
      advanced: m.advanced ?? undefined,
    }))

  const matches = [...groupPicks, ...koPicks]

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">⚽ Family Picks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Predict every match · earn points</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
          <Link href="/worldcup" className="text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
            Standings →
          </Link>
          <Link href="/worldcup/knockout" className="text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
            Bracket →
          </Link>
        </div>
      </div>

      <PicksClient users={PREDICTORS} matches={matches} picks={picks} leaderboard={leaderboard} />
    </div>
  )
}
