import { Redis } from '@upstash/redis'
import type { Kid } from './types'
import { PRACTICE_THROUGH_LESSON } from './games/sightwords'

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
  try {
    const kids = await redis.get<Kid[]>('kids')
    if (!kids) {
      await redis.set('kids', DEFAULT_KIDS)
      return DEFAULT_KIDS
    }
    return kids
  } catch {
    // Redis unavailable (e.g. local without creds): show defaults.
    return DEFAULT_KIDS
  }
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
  try {
    return (await redis.get<string[]>(todayKey())) ?? []
  } catch {
    return []
  }
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

// Zoe's reading game — +5 once per day for finishing a round.
const READING_KID = 'Zoe'
function readingTodayKey() {
  return `reading:${new Date().toISOString().split('T')[0]}`
}

export async function hasReadingRewardToday(): Promise<boolean> {
  try {
    return (await redis.get<boolean>(readingTodayKey())) === true
  } catch {
    return false
  }
}

export async function claimReadingReward(): Promise<boolean> {
  try {
    if (await hasReadingRewardToday()) return false
    await redis.set(readingTodayKey(), true)
    await updateKidPoints(READING_KID, 5)
    return true
  } catch {
    return false
  }
}

// Per-word mastery: correct vs incorrect attempts in the Find/Type games,
// plus the actual wrong spellings typed (so we can spot repeated mistakes).
export type ReadingAttempt = {
  word: string
  correct: number
  wrong: number
  misses?: Record<string, number>
}
type ReadingStats = Record<string, { c: number; w: number; m?: Record<string, number> }>

export async function getReadingStats(): Promise<ReadingStats> {
  try {
    return (await redis.get<ReadingStats>('reading:stats')) ?? {}
  } catch {
    return {}
  }
}

export async function recordReadingAttempts(attempts: ReadingAttempt[]): Promise<void> {
  if (!attempts.length) return
  try {
    const stats = (await redis.get<ReadingStats>('reading:stats')) ?? {}
    for (const a of attempts) {
      const cur = stats[a.word] ?? { c: 0, w: 0 }
      cur.c += a.correct || 0
      cur.w += a.wrong || 0
      if (a.misses) {
        cur.m = cur.m ?? {}
        for (const [typed, n] of Object.entries(a.misses)) {
          cur.m[typed] = (cur.m[typed] ?? 0) + n
        }
      }
      stats[a.word] = cur
    }
    await redis.set('reading:stats', stats)
  } catch {
    // best-effort: don't block gameplay on stat writes
  }
}

// How far through the word list Zoe is practicing (parent-controlled in admin).
export async function getReadingLevel(): Promise<number> {
  try {
    return (await redis.get<number>('reading:level')) ?? PRACTICE_THROUGH_LESSON
  } catch {
    return PRACTICE_THROUGH_LESSON
  }
}

export async function setReadingLevel(through: number): Promise<void> {
  await redis.set('reading:level', through)
}

// Flag quiz — a one-time +10 per kid for naming every World Cup flag.
const FLAG_QUIZ_KEY = 'flagquiz:winners'

export async function getFlagQuizWinners(): Promise<string[]> {
  try {
    return (await redis.get<string[]>(FLAG_QUIZ_KEY)) ?? []
  } catch {
    return []
  }
}

export async function hasKidWonFlagQuiz(kidName: string): Promise<boolean> {
  return (await getFlagQuizWinners()).includes(kidName)
}

// Awards +10 the first time a kid finishes the flag quiz. Returns true if the
// points were granted, false if they'd already earned it.
export async function awardFlagQuiz(kidName: string): Promise<boolean> {
  const winners = await getFlagQuizWinners()
  if (winners.includes(kidName)) return false
  await redis.set(FLAG_QUIZ_KEY, [...winners, kidName])
  await updateKidPoints(kidName, 10)
  return true
}

// License-plate game — a shared board of spotted states (by slug).
const PLATES_KEY = 'plates:spotted'

export async function getSpottedStates(): Promise<string[]> {
  try {
    return (await redis.get<string[]>(PLATES_KEY)) ?? []
  } catch {
    return []
  }
}

export async function setStateSpotted(slug: string, spotted: boolean): Promise<void> {
  const current = await getSpottedStates()
  const set = new Set(current)
  if (spotted) set.add(slug)
  else set.delete(slug)
  await redis.set(PLATES_KEY, [...set])
}

// Web push subscriptions (shared across the family's devices), keyed by the
// subscription endpoint so re-subscribing replaces the old record.
const PUSH_KEY = 'push:subscriptions'

export type PushSub = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function getPushSubscriptions(): Promise<PushSub[]> {
  try {
    const map = (await redis.get<Record<string, PushSub>>(PUSH_KEY)) ?? {}
    return Object.values(map)
  } catch {
    return []
  }
}

export async function savePushSubscription(sub: PushSub): Promise<void> {
  const map = (await redis.get<Record<string, PushSub>>(PUSH_KEY)) ?? {}
  map[sub.endpoint] = sub
  await redis.set(PUSH_KEY, map)
}

export async function removePushSubscriptions(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return
  const map = (await redis.get<Record<string, PushSub>>(PUSH_KEY)) ?? {}
  for (const e of endpoints) delete map[e]
  await redis.set(PUSH_KEY, map)
}
