import { hasReadingRewardToday } from '@/lib/redis'
import { activeWords, CHOICES, imageableActiveWords, ROUND_SIZE } from '@/lib/games/sightwords'
import ReadingClient from './ReadingClient'

export const metadata = { title: 'Reading Games — Zoe' }

export default async function ReadingPage() {
  const rewardClaimed = await hasReadingRewardToday()

  return (
    <div className="min-h-screen px-4 pb-12 pt-6">
      <ReadingClient
        words={activeWords().map((w) => w.word)}
        imageWords={imageableActiveWords()}
        roundSize={ROUND_SIZE}
        choices={CHOICES}
        rewardClaimed={rewardClaimed}
      />
    </div>
  )
}
