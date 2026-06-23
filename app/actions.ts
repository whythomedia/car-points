'use server'

import { revalidatePath } from 'next/cache'
import {
  awardFlagQuiz,
  claimReadingReward,
  claimVaultForKid,
  getReadingLevel,
  getReadingStats,
  getSpottedStates,
  getVaultClaimantsToday,
  hasKidClaimedToday,
  recordReadingAttempts,
  removePushSubscriptions,
  savePushSubscription,
  setReadingLevel,
  setStateSpotted,
  updateKidPoints,
  type PushSub,
  type ReadingAttempt,
} from '@/lib/redis'
import { SIGHT_WORDS } from '@/lib/games/sightwords'
import { getTodayRiddle } from '@/lib/riddles'
import { clearResult, getResults, saveResult } from '@/lib/worldcup/store'
import { buildLeaderboard, getAllPicks, savePick, type GradedMatch } from '@/lib/worldcup/picks'
import { groupMatches } from '@/lib/worldcup/predict'
import { GROUPS } from '@/lib/worldcup/data'
import { matchId } from '@/lib/worldcup/fixtures'
import { STATES } from '@/lib/games/states'
import { isPushConfigured, notifyResult, notifyStateSpotted, sendPushToAll } from '@/lib/push'

export async function updateScore(kidName: string, delta: number): Promise<void> {
  await updateKidPoints(kidName, delta)
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  return password === (process.env.ADMIN_PASSWORD ?? 'space')
}

export async function submitVaultAnswer(
  kidName: string,
  answer: string
): Promise<{ success: boolean; error?: string }> {
  const already = await hasKidClaimedToday(kidName)
  if (already) {
    return { success: false, error: `${kidName} already claimed the vault today!` }
  }

  const riddle = getTodayRiddle()
  const normalized = answer.trim().toLowerCase()

  if (riddle.answers.includes(normalized)) {
    await claimVaultForKid(kidName)
    revalidatePath('/')
    revalidatePath('/bonus')
    return { success: true }
  }

  return { success: false, error: "Not quite — try again!" }
}

export async function saveWorldCupResult(
  groupId: string,
  a: string,
  b: string,
  ga: number,
  gb: number
): Promise<void> {
  const cga = Math.max(0, Math.min(20, Math.round(Number(ga) || 0)))
  const cgb = Math.max(0, Math.min(20, Math.round(Number(gb) || 0)))
  await saveResult(groupId, a, b, cga, cgb)
  revalidatePath('/worldcup')
  revalidatePath('/worldcup/picks')

  // Recompute the leaderboard with the new result and push it out.
  try {
    const [results, picks] = await Promise.all([getResults(), getAllPicks()])
    const played: GradedMatch[] = GROUPS.flatMap((g) =>
      groupMatches(g, results)
        .filter((m) => m.played)
        .map((m) => ({ matchId: matchId(g.id, m.home.name, m.away.name), actual: { ga: m.ga, gb: m.gb } }))
    )
    const leaderboard = buildLeaderboard(picks, played)
    await notifyResult(`${a} ${cga}–${cgb} ${b}`, leaderboard)
  } catch {
    // push failures shouldn't block saving the result
  }
}

export async function clearWorldCupResult(
  groupId: string,
  a: string,
  b: string
): Promise<void> {
  await clearResult(groupId, a, b)
  revalidatePath('/worldcup')
}

export async function completeReadingRound(
  attempts: ReadingAttempt[] = []
): Promise<{ awarded: boolean }> {
  await recordReadingAttempts(attempts)
  const awarded = await claimReadingReward()
  if (awarded) {
    revalidatePath('/')
    revalidatePath('/games')
  }
  return { awarded }
}

export type ReadingProgress = {
  level: number
  count: number
  nextWord: string | null
  rows: { n: number; word: string; correct: number; wrong: number }[]
}

export async function getReadingProgress(
  password: string
): Promise<{ ok: boolean; progress?: ReadingProgress }> {
  if (!(await checkAdminPassword(password))) return { ok: false }
  const [level, stats] = await Promise.all([getReadingLevel(), getReadingStats()])
  const rows = SIGHT_WORDS.filter((w) => w.n <= level).map((w) => ({
    n: w.n,
    word: w.word,
    correct: stats[w.word]?.c ?? 0,
    wrong: stats[w.word]?.w ?? 0,
  }))
  const next = SIGHT_WORDS.find((w) => w.n > level)
  return {
    ok: true,
    progress: { level, count: rows.length, nextWord: next?.word ?? null, rows },
  }
}

export async function adjustReadingLevel(
  password: string,
  dir: 'add' | 'remove'
): Promise<{ ok: boolean; progress?: ReadingProgress }> {
  if (!(await checkAdminPassword(password))) return { ok: false }
  const level = await getReadingLevel()
  if (dir === 'add') {
    const next = SIGHT_WORDS.find((w) => w.n > level)
    if (next) await setReadingLevel(next.n)
  } else {
    const active = SIGHT_WORDS.filter((w) => w.n <= level)
    if (active.length > 1) await setReadingLevel(active[active.length - 2].n)
  }
  revalidatePath('/games/reading')
  return getReadingProgress(password)
}

export async function completeFlagQuiz(
  kidName: string
): Promise<{ awarded: boolean }> {
  const awarded = await awardFlagQuiz(kidName)
  if (awarded) {
    revalidatePath('/')
    revalidatePath('/games')
  }
  return { awarded }
}

export async function toggleStateSpotted(
  slug: string,
  spotted: boolean
): Promise<void> {
  await setStateSpotted(slug, spotted)
  revalidatePath('/games/plates')
  revalidatePath('/games')

  if (spotted) {
    const state = STATES.find((s) => s.slug === slug)
    const count = (await getSpottedStates()).length
    if (state) {
      try {
        await notifyStateSpotted(state.name, count, STATES.length)
      } catch {
        // never let a push failure break the action
      }
    }
  }
}

export async function subscribeToPush(sub: PushSub): Promise<void> {
  await savePushSubscription(sub)
}

// Broadcast a custom message to every subscribed device (admin only).
export async function sendAdminMessage(
  password: string,
  message: string
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  if (password !== (process.env.ADMIN_PASSWORD ?? 'space')) {
    return { ok: false, error: 'Not authorized.' }
  }
  const body = message.trim()
  if (!body) return { ok: false, error: 'Type a message first.' }
  if (!isPushConfigured()) return { ok: false, error: 'Push not configured (check VAPID keys).' }
  try {
    const sent = await sendPushToAll({ title: '📣 Car Points', body, url: '/', tag: 'admin' })
    return { ok: true, sent }
  } catch {
    return { ok: false, error: 'Send failed — check the server logs.' }
  }
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await removePushSubscriptions([endpoint])
}

export async function saveWorldCupPick(
  matchId: string,
  user: string,
  ga: number,
  gb: number
): Promise<void> {
  const clean = (n: number) => Math.max(0, Math.min(20, Math.round(Number(n) || 0)))
  await savePick(matchId, user, clean(ga), clean(gb))
  revalidatePath('/worldcup/picks')
}
