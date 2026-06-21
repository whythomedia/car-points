import { redis } from '../redis'
import { GROUPS } from './data'
import type { Group } from './data'

// Actual results the family enters during the trip are layered on top of the
// seeded data in `data.ts`. They're keyed by a stable match id so an entry
// survives even if the seed data is later edited.

export type Override = { ga: number; gb: number }
type Overrides = Record<string, Override>

const KEY = 'worldcup:results'

// Canonical id for a pairing: group + the two teams in their group order, so
// the same match maps to one id no matter which side is passed first.
export function matchId(groupId: string, a: string, b: string): string {
  const group = GROUPS.find((g) => g.id === groupId)
  const order = group ? group.teams.map((t) => t.name) : [a, b]
  const [first, second] = [a, b].sort((x, y) => order.indexOf(x) - order.indexOf(y))
  return `${groupId}|${first}|${second}`
}

async function getOverrides(): Promise<Overrides> {
  try {
    return (await redis.get<Overrides>(KEY)) ?? {}
  } catch {
    // Offline / Redis unavailable: still show predictions from seeded data.
    return {}
  }
}

// GROUPS with any saved actual results merged into each group's result list.
export async function getGroupsWithResults(): Promise<Group[]> {
  const overrides = await getOverrides()
  if (Object.keys(overrides).length === 0) return GROUPS

  return GROUPS.map((group) => {
    const results = [...group.results]
    for (const [home, away] of pairs(group.teams.map((t) => t.name))) {
      const ov = overrides[matchId(group.id, home, away)]
      if (!ov) continue
      const existing = results.findIndex(
        (r) =>
          (r.a === home && r.b === away) || (r.a === away && r.b === home)
      )
      const entry = { a: home, b: away, ga: ov.ga, gb: ov.gb }
      if (existing >= 0) results[existing] = entry
      else results.push(entry)
    }
    return { ...group, results }
  })
}

export async function saveResult(
  groupId: string,
  a: string,
  b: string,
  ga: number,
  gb: number
): Promise<void> {
  const overrides = await getOverrides()
  overrides[matchId(groupId, a, b)] = { ga, gb }
  await redis.set(KEY, overrides)
}

export async function clearResult(groupId: string, a: string, b: string): Promise<void> {
  const overrides = await getOverrides()
  delete overrides[matchId(groupId, a, b)]
  await redis.set(KEY, overrides)
}

function pairs(names: string[]): [string, string][] {
  const out: [string, string][] = []
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) out.push([names[i], names[j]])
  return out
}
