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
import { getBlimpReport } from '@/lib/blimp'
import { getTodayRiddle } from '@/lib/riddles'
import { clearResult, saveResult } from '@/lib/worldcup/store'
import { savePick } from '@/lib/worldcup/picks'
import { clearKoResult, saveKoResult } from '@/lib/worldcup/ko-store'
import { ROUND_META, koMatchId, resolveBracket } from '@/lib/worldcup/bracket'
import { getKoResults } from '@/lib/worldcup/ko-store'
import { loadCombinedLeaderboard } from '@/lib/worldcup/leaderboard'
import { STATES } from '@/lib/games/states'
import { choreToday, setChoreDone } from '@/lib/chores'
import { getCurrentUser } from '@/lib/current-user'
import { personByName, USER_COOKIE } from '@/lib/people'
import { cookies } from 'next/headers'
import { isPushConfigured, notifyKnockout, notifyResult, notifyStateSpotted, sendPushToAll } from '@/lib/push'

export async function updateScore(kidName: string, delta: number): Promise<void> {
  await updateKidPoints(kidName, delta)
  revalidatePath('/')
  revalidatePath('/admin')
}

// Set (or clear) the signed-in family member. Cookie so server components can
// personalize without a flash. Revalidates the whole tree so every page updates.
export async function setCurrentUser(name: string): Promise<void> {
  const jar = await cookies()
  if (name && personByName(name)) {
    jar.set(USER_COOKIE, name, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  } else {
    jar.delete(USER_COOKIE)
  }
  revalidatePath('/', 'layout')
}

export async function toggleChore(kid: string, taskId: string, done: boolean): Promise<void> {
  // Restrict: you can only check off your own chores (must be signed in as them).
  const me = await getCurrentUser()
  if (!me || me.name !== kid) return
  await setChoreDone(kid, taskId, choreToday(), done)
  revalidatePath('/chores')
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

  // Recompute the combined (group + knockout) leaderboard and push it out.
  try {
    const leaderboard = await loadCombinedLeaderboard()
    await notifyResult(`${a} ${cga}–${cgb} ${b}`, leaderboard)
  } catch {
    // push failures shouldn't block saving the result
  }
}

const clampGoals = (n: number) => Math.max(0, Math.min(20, Math.round(Number(n) || 0)))

export async function saveWorldCupKoResult(
  no: number,
  ga: number,
  gb: number,
  advanced?: 'home' | 'away'
): Promise<void> {
  const cga = clampGoals(ga)
  const cgb = clampGoals(gb)
  await saveKoResult(no, cga, cgb, advanced)
  revalidatePath('/worldcup/knockout')
  revalidatePath('/worldcup')

  // Announce who advanced, with the updated combined leaderboard.
  try {
    const leaderboard = await loadCombinedLeaderboard()
    const m = resolveBracket(await getKoResults()).find((r) => r.no === no)
    if (m && m.winner && m.home && m.away) {
      await notifyKnockout(`${m.home} ${cga}–${cgb} ${m.away}`, m.winner, ROUND_META[m.round].label, leaderboard)
    }
  } catch {
    // push failures shouldn't block saving the result
  }
}

export async function clearWorldCupKoResult(no: number): Promise<void> {
  await clearKoResult(no)
  revalidatePath('/worldcup/knockout')
  revalidatePath('/worldcup')
}

export async function saveWorldCupKoPick(
  no: number,
  user: string,
  ga: number,
  gb: number,
  adv?: 'home' | 'away'
): Promise<void> {
  await savePick(koMatchId(no), user, clampGoals(ga), clampGoals(gb), adv)
  revalidatePath('/worldcup')
  revalidatePath('/worldcup/knockout')
}

export async function clearWorldCupResult(
  groupId: string,
  a: string,
  b: string
): Promise<void> {
  await clearResult(groupId, a, b)
  revalidatePath('/worldcup')
}

export async function fetchBlimp() {
  return getBlimpReport()
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
  rows: {
    n: number
    word: string
    correct: number
    wrong: number
    misses: { text: string; count: number }[]
  }[]
}

export async function getReadingProgress(
  password: string
): Promise<{ ok: boolean; progress?: ReadingProgress }> {
  if (!(await checkAdminPassword(password))) return { ok: false }
  const [level, stats] = await Promise.all([getReadingLevel(), getReadingStats()])
  const rows = SIGHT_WORDS.filter((w) => w.n <= level).map((w) => {
    const s = stats[w.word]
    const misses = s?.m
      ? Object.entries(s.m)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([text, count]) => ({ text, count }))
      : []
    return { n: w.n, word: w.word, correct: s?.c ?? 0, wrong: s?.w ?? 0, misses }
  })
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
  revalidatePath('/worldcup')
}
