'use server'

import { revalidatePath } from 'next/cache'
import { claimVaultForKid, getVaultClaimantsToday, hasKidClaimedToday, updateKidPoints } from '@/lib/redis'
import { getTodayRiddle } from '@/lib/riddles'
import { clearResult, saveResult } from '@/lib/worldcup/store'
import { savePick } from '@/lib/worldcup/picks'

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
  const clean = (n: number) => Math.max(0, Math.min(20, Math.round(Number(n) || 0)))
  await saveResult(groupId, a, b, clean(ga), clean(gb))
  revalidatePath('/worldcup')
}

export async function clearWorldCupResult(
  groupId: string,
  a: string,
  b: string
): Promise<void> {
  await clearResult(groupId, a, b)
  revalidatePath('/worldcup')
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
