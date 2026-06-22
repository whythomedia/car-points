import Link from 'next/link'
import { getGroupsWithResults, matchId } from '@/lib/worldcup/store'
import { groupMatches, predictMatch } from '@/lib/worldcup/predict'
import { GROUP_COLORS, PREDICTORS } from '@/lib/worldcup/brand'
import { buildLeaderboard, getAllPicks, type GradedMatch } from '@/lib/worldcup/picks'
import PicksClient, { type PickMatch } from './PicksClient'

export const metadata = {
  title: 'World Cup 2026 — Family Picks',
}

export default async function PicksPage() {
  const [groups, picks] = await Promise.all([getGroupsWithResults(), getAllPicks()])

  const matches: PickMatch[] = groups.flatMap((group) =>
    groupMatches(group).map((m) => {
      const hint = m.played ? { ga: m.ga, gb: m.gb } : predictMatch(m.home, m.away)
      return {
        matchId: matchId(group.id, m.home.name, m.away.name),
        group: group.id,
        groupColor: GROUP_COLORS[group.id],
        homeName: m.home.name,
        homeFlag: m.home.flag,
        awayName: m.away.name,
        awayFlag: m.away.flag,
        played: m.played,
        ga: m.played ? m.ga : hint.ga,
        gb: m.played ? m.gb : hint.gb,
      }
    })
  )

  const played: GradedMatch[] = matches
    .filter((m) => m.played)
    .map((m) => ({ matchId: m.matchId, actual: { ga: m.ga, gb: m.gb } }))

  const leaderboard = buildLeaderboard(picks, played)

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">⚽ Family Picks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Predict every match · earn points</p>
        </div>
        <Link
          href="/worldcup"
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          Standings →
        </Link>
      </div>

      <PicksClient
        users={PREDICTORS}
        matches={matches}
        picks={picks}
        leaderboard={leaderboard}
      />
    </div>
  )
}
