'use server'

import { revalidatePath } from 'next/cache'
import {
  awardFlagQuiz,
  awardMuseumPuzzles,
  clearMuseumSave,
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
  setMuseumSave,
  setReadingLevel,
  setStateSpotted,
  updateKidPoints,
  type PushSub,
  type ReadingAttempt,
} from '@/lib/redis'
import { SIGHT_WORDS } from '@/lib/games/sightwords'
import { getBlimpReport } from '@/lib/blimp'
import { getTodayRiddle } from '@/lib/riddles'
import { STATES } from '@/lib/games/states'
import { addExtraChore, choreToday, removeExtraChore, setChoreDone } from '@/lib/chores'
import { getCurrentUser } from '@/lib/current-user'
import { personByName, USER_COOKIE } from '@/lib/people'
import { cookies } from 'next/headers'
import { isPushConfigured, notifyStateSpotted, sendPushToAll } from '@/lib/push'
import type { MuseumState } from '@/lib/games/museum/engine.mjs'

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

// One-off chores: only a parent can add/remove them, and only for today.
export async function addChore(kid: string, label: string): Promise<void> {
  const me = await getCurrentUser()
  if (me?.role !== 'parent') return
  await addExtraChore(kid, choreToday(), label)
  revalidatePath('/chores')
}

export async function removeChore(kid: string, id: string): Promise<void> {
  const me = await getCurrentUser()
  if (me?.role !== 'parent') return
  await removeExtraChore(kid, choreToday(), id)
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

// Museum game. The engine runs in the browser; this saves the signed-in
// person's game and pays the one-time bonus for any puzzle they have finished.
// Returns the treasures newly paid for, so the page can say so.
const MUSEUM_SAVE_LIMIT = 200_000 // bytes of JSON; a real save is a fraction of this

export async function saveMuseumGame(
  state: MuseumState
): Promise<{ ok: boolean; awarded: string[] }> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, awarded: [] }
  if (!state || typeof state !== 'object' || typeof state.id !== 'string' || !Array.isArray(state.placed)) {
    return { ok: false, awarded: [] }
  }
  if (JSON.stringify(state).length > MUSEUM_SAVE_LIMIT) return { ok: false, awarded: [] }

  await setMuseumSave(me.name, { state, savedAt: new Date().toISOString() })

  let awarded: string[] = []
  if (me.role === 'kid' && state.placed.length) {
    awarded = await awardMuseumPuzzles(me.name, state.placed.filter((t) => typeof t === 'string'))
    if (awarded.length) {
      revalidatePath('/')
      revalidatePath('/points')
    }
  }
  return { ok: true, awarded }
}

// Start over: forget the signed-in person's saved game. Bonuses already paid stay paid.
export async function resetMuseumGame(): Promise<void> {
  const me = await getCurrentUser()
  if (!me) return
  await clearMuseumSave(me.name)
}
