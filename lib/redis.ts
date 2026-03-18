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

export async function getTodayVaultStatus(): Promise<{ claimed: boolean; winner?: string }> {
  const today = new Date().toISOString().split('T')[0]
  const [vaultDate, vaultWinner] = await Promise.all([
    redis.get<string>('vault_date'),
    redis.get<string>('vault_winner'),
  ])
  if (vaultDate === today) {
    return { claimed: true, winner: vaultWinner ?? undefined }
  }
  return { claimed: false }
}

export async function claimVault(kidName: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await Promise.all([
    redis.set('vault_date', today),
    redis.set('vault_winner', kidName),
  ])
  await updateKidPoints(kidName, 5)
}
