import { redis } from '../redis'
import { PREDICTORS } from './brand'
import { matchId } from './store'
import { SEED_PICKS } from './seed-picks'

// Each family member's predicted score for a match, plus the scoring rules:
//   exact score  → 3 pts
//   right outcome (W/D/L) but wrong score → 1 pt
//   wrong outcome → 0 pts
// Picks are keyed by the same stable match id used in store.ts.

// `adv` is only used for knockout picks: which side the picker thinks advances,
// needed when they predict a level score (penalties). Group picks never set it.
export type Pick = { ga: number; gb: number; adv?: 'home' | 'away' }
export type PicksByUser = Record<string, Pick>
export type AllPicks = Record<string, PicksByUser>

const KEY = 'worldcup:picks'

const outcome = (p: Pick) => Math.sign(p.ga - p.gb)

export function scorePick(pick: Pick, actual: Pick): 0 | 1 | 3 {
  if (pick.ga === actual.ga && pick.gb === actual.gb) return 3
  return outcome(pick) === outcome(actual) ? 1 : 0
}

// Knockout scoring: exact regulation/ET score = 3; otherwise picking the team
// that actually advances = 1. The advancer of a pick is the higher score, or
// `adv` when the picker predicted a level score.
export function scoreKoPick(pick: Pick, actual: Pick, advanced: 'home' | 'away'): 0 | 1 | 3 {
  if (pick.ga === actual.ga && pick.gb === actual.gb) return 3
  const pickAdv = pick.ga > pick.gb ? 'home' : pick.gb > pick.ga ? 'away' : pick.adv
  return pickAdv && pickAdv === advanced ? 1 : 0
}

export type LeaderRow = {
  name: string
  color: string
  points: number
  exact: number // # of 3-pointers
  correct: number // # of 1-pointers
  graded: number // # of played matches this person picked
}

// `ko` marks a knockout match so it's scored with scoreKoPick (advancer-based).
export type GradedMatch = { matchId: string; actual: Pick; ko?: { advanced: 'home' | 'away' } }

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
      const pts = match.ko ? scoreKoPick(pick, match.actual, match.ko.advanced) : scorePick(pick, match.actual)
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

// The hand-transcribed picks, keyed by canonical match id.
function seedPicks(): AllPicks {
  const out: AllPicks = {}
  for (const s of SEED_PICKS) {
    out[matchId(s.group, s.home, s.away)] = { ...s.picks }
  }
  return out
}

// Seed picks form the base; anything entered later via the app overrides them
// per (match, user) from Redis.
export async function getAllPicks(): Promise<AllPicks> {
  const all = seedPicks()
  try {
    const stored = (await redis.get<AllPicks>(KEY)) ?? {}
    for (const [mid, byUser] of Object.entries(stored)) {
      all[mid] = { ...(all[mid] ?? {}), ...byUser }
    }
  } catch {
    // Offline / Redis unavailable: seed picks still populate the leaderboard.
  }
  return all
}

export async function savePick(
  matchId: string,
  user: string,
  ga: number,
  gb: number,
  adv?: 'home' | 'away'
): Promise<void> {
  const all = await getAllPicks()
  const forMatch = all[matchId] ?? {}
  forMatch[user] = adv ? { ga, gb, adv } : { ga, gb }
  all[matchId] = forMatch
  await redis.set(KEY, all)
}
