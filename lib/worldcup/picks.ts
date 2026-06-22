import { redis } from '../redis'
import { PREDICTORS } from './brand'

// Each family member's predicted score for a match, plus the scoring rules:
//   exact score  → 3 pts
//   right outcome (W/D/L) but wrong score → 1 pt
//   wrong outcome → 0 pts
// Picks are keyed by the same stable match id used in store.ts.

export type Pick = { ga: number; gb: number }
export type PicksByUser = Record<string, Pick>
export type AllPicks = Record<string, PicksByUser>

const KEY = 'worldcup:picks'

const outcome = (p: Pick) => Math.sign(p.ga - p.gb)

export function scorePick(pick: Pick, actual: Pick): 0 | 1 | 3 {
  if (pick.ga === actual.ga && pick.gb === actual.gb) return 3
  return outcome(pick) === outcome(actual) ? 1 : 0
}

export type LeaderRow = {
  name: string
  color: string
  points: number
  exact: number // # of 3-pointers
  correct: number // # of 1-pointers
  graded: number // # of played matches this person picked
}

export type GradedMatch = { matchId: string; actual: Pick }

export function buildLeaderboard(
  picks: AllPicks,
  played: GradedMatch[]
): LeaderRow[] {
  const rows = PREDICTORS.map((p) => ({
    name: p.name,
    color: p.color,
    points: 0,
    exact: 0,
    correct: 0,
    graded: 0,
  }))
  const byName = new Map(rows.map((r) => [r.name, r]))

  for (const match of played) {
    const matchPicks = picks[match.matchId]
    if (!matchPicks) continue
    for (const [name, pick] of Object.entries(matchPicks)) {
      const row = byName.get(name)
      if (!row) continue
      const pts = scorePick(pick, match.actual)
      row.points += pts
      row.graded++
      if (pts === 3) row.exact++
      else if (pts === 1) row.correct++
    }
  }

  // Highest points first, then most exact hits, then name for stability.
  return rows.sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name)
  )
}

export async function getAllPicks(): Promise<AllPicks> {
  try {
    return (await redis.get<AllPicks>(KEY)) ?? {}
  } catch {
    return {}
  }
}

export async function savePick(
  matchId: string,
  user: string,
  ga: number,
  gb: number
): Promise<void> {
  const all = await getAllPicks()
  const forMatch = all[matchId] ?? {}
  forMatch[user] = { ga, gb }
  all[matchId] = forMatch
  await redis.set(KEY, all)
}
