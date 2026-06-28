import { GROUPS } from './data'
import { getResults, matchId } from './store'
import { getKoResults } from './ko-store'
import { koGraded } from './bracket'
import { groupMatches } from './predict'
import { buildLeaderboard, getAllPicks, type GradedMatch, type LeaderRow } from './picks'

// One combined standing across group stage + knockout, scored by the same
// rules (knockout matches use advancer-based outcomes).
export async function loadCombinedLeaderboard(): Promise<LeaderRow[]> {
  const [results, koResults, picks] = await Promise.all([getResults(), getKoResults(), getAllPicks()])

  const groupPlayed: GradedMatch[] = GROUPS.flatMap((g) =>
    groupMatches(g, results)
      .filter((m) => m.played)
      .map((m) => ({ matchId: matchId(g.id, m.home.name, m.away.name), actual: { ga: m.ga, gb: m.gb } }))
  )

  return buildLeaderboard(picks, [...groupPlayed, ...koGraded(koResults)])
}
