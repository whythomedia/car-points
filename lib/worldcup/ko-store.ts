import { redis } from '../redis'
import type { KoResults } from './bracket'

// Knockout results live in their own Redis key, keyed by FIFA match number.
// (Group results stay in 'worldcup:results', keyed by team-derived matchId.)

const KEY = 'worldcup:ko-results'

export async function getKoResults(): Promise<KoResults> {
  try {
    return (await redis.get<KoResults>(KEY)) ?? {}
  } catch {
    return {}
  }
}

// Save a result. A decisive score implies the advancer; a level score (penalty
// shootout) requires `advanced` to be passed.
export async function saveKoResult(
  no: number,
  ga: number,
  gb: number,
  advanced?: 'home' | 'away'
): Promise<void> {
  const adv: 'home' | 'away' | undefined = ga > gb ? 'home' : gb > ga ? 'away' : advanced
  if (!adv) throw new Error('A level knockout score needs an explicit advancer')
  const all = await getKoResults()
  all[no] = { ga, gb, advanced: adv }
  await redis.set(KEY, all)
}

export async function clearKoResult(no: number): Promise<void> {
  const all = await getKoResults()
  delete all[no]
  await redis.set(KEY, all)
}
