import Link from 'next/link'
import { hasReadingRewardToday } from '@/lib/redis'
import { activeWords, CHOICES, ROUND_SIZE } from '@/lib/games/sightwords'
import ReadingClient from './ReadingClient'

export const metadata = { title: 'Reading — Zoe' }

export default async function ReadingPage() {
  const rewardClaimed = await hasReadingRewardToday()

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">📖 Zoe&apos;s Reading</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sight words · +5 a day</p>
        </div>
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      </div>

      <ReadingClient
        words={activeWords()}
        roundSize={ROUND_SIZE}
        choices={CHOICES}
        rewardClaimed={rewardClaimed}
      />
    </div>
  )
}
