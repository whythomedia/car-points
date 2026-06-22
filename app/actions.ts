'use server'

import { revalidatePath } from 'next/cache'
import {
  awardFlagQuiz,
  claimVaultForKid,
  getSpottedStates,
  getVaultClaimantsToday,
  hasKidClaimedToday,
  removePushSubscriptions,
  savePushSubscription,
  setStateSpotted,
  updateKidPoints,
  type PushSub,
} from '@/lib/redis'
import { getTodayRiddle } from '@/lib/riddles'
import { clearResult, getResults, saveResult } from '@/lib/worldcup/store'
import { buildLeaderboard, getAllPicks, savePick, type GradedMatch } from '@/lib/worldcup/picks'
import { groupMatches } from '@/lib/worldcup/predict'
import { GROUPS } from '@/lib/worldcup/data'
import { matchId } from '@/lib/worldcup/fixtures'
import { STATES } from '@/lib/games/states'
import { notifyResult, notifyStateSpotted } from '@/lib/push'

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
