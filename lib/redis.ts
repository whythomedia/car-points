import { Redis } from '@upstash/redis'
import type { Kid } from './types'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const DEFAULT_KIDS: Kid[] = [
  { name: 'Owen', points: 0 },
  { name: 'Zoe', points: 0 },
  { name: 'Max', points: 0 },
  { name: 'Emma', points: 0 },
]

export async function getKids(): Promise<Kid[]> {
  const kids = await redis.get<Kid[]>('kids')
  if (!kids) {
    await redis.set('kids', DEFAULT_KIDS)
    return DEFAULT_KIDS
  }
  return kids
}

export async function updateKidPoints(name: string, delta: number): Promise<void> {
  const kids = await getKids()
  const updated = kids.map((k) =>
    k.name === name ? { ...k, points: Math.max(0, k.points + delta) } : k
  )
  await redis.set('kids', updated)
}

function todayKey() {
  return `vault:${new Date().toISOString().split('T')[0]}`
}

export async function getVaultClaimantsToday(): Promise<string[]> {
  const claimants = await redis.get<string[]>(todayKey())
  return claimants ?? []
}

export async function hasKidClaimedToday(kidName: string): Promise<boolean> {
  const claimants = await getVaultClaimantsToday()
  return claimants.includes(kidName)
}

export async function claimVaultForKid(kidName: string): Promise<void> {
  const claimants = await getVaultClaimantsToday()
  if (!claimants.includes(kidName)) {
    await redis.set(todayKey(), [...claimants, kidName])
    await updateKidPoints(kidName, 5)
  }
}
