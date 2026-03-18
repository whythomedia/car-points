'use server'

import { revalidatePath } from 'next/cache'
import { claimVaultForKid, getVaultClaimantsToday, hasKidClaimedToday, updateKidPoints } from '@/lib/redis'
import { getTodayRiddle } from '@/lib/riddles'

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
