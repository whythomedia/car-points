import { redis } from '../redis'
import { FIXTURE_BY_ID, matchId } from './fixtures'

// Results are keyed by matchId and oriented to the fixture's home team. The
// schedule (fixtures.ts) supplies the base scores; anything the family enters
// during the trip is layered on top in Redis.

export type Result = { ga: number; gb: number }
type Results = Record<string, Result>

const KEY = 'worldcup:results'

// Re-export so existing imports keep working.
export { matchId }

async function getOverrides(): Promise<Results> {
  try {
    return (await redis.get<Results>(KEY)) ?? {}
  } catch {
    // Offline / Redis unavailable: fall back to the scheduled results only.
    return {}
  }
}

export async function getResults(): Promise<Results> {
  const base: Results = {}
  for (const [id, f] of FIXTURE_BY_ID) {
    if (f.ga !== null && f.gb !== null) base[id] = { ga: f.ga, gb: f.gb }
  }
  const overrides = await getOverrides()
  return { ...base, ...overrides }
}

export async function saveResult(
  groupId: string,
  a: string,
  b: string,
  ga: number,
  gb: number
): Promise<void> {
  const id = matchId(groupId, a, b)
  const f = FIXTURE_BY_ID.get(id)
  // Always store oriented to the fixture's home team.
  const stored = f && f.home === b ? { ga: gb, gb: ga } : { ga, gb }
  const overrides = await getOverrides()
  overrides[id] = stored
  await redis.set(KEY, overrides)
}

export async function clearResult(groupId: string, a: string, b: string): Promise<void> {
  const overrides = await getOverrides()
  delete overrides[matchId(groupId, a, b)]
  await redis.set(KEY, overrides)
}
