import { getReadingLevel, hasReadingRewardToday } from '@/lib/redis'
import { activeWords, CHOICES, imageableActiveWords, ROUND_SIZE } from '@/lib/games/sightwords'
import ReadingClient from './ReadingClient'

export const metadata = { title: 'Reading Games — Zoe' }

export default async function ReadingPage() {
  const [rewardClaimed, level] = await Promise.all([hasReadingRewardToday(), getReadingLevel()])

  return (
    <div className="min-h-screen px-4 pb-12 pt-6">
      <ReadingClient
        words={activeWords(level).map((w) => w.word)}
        imageWords={imageableActiveWords(level)}
        roundSize={ROUND_SIZE}
        choices={CHOICES}
        rewardClaimed={rewardClaimed}
      />
    </div>
  )
}
