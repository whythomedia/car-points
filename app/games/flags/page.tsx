import Link from 'next/link'
import { getFlagQuizWinners } from '@/lib/redis'
import { FLAG_QUESTIONS } from '@/lib/games/flagquiz'
import FlagQuizClient from './FlagQuizClient'

export const metadata = { title: 'Flag Quiz' }

export default async function FlagQuizPage() {
  const winners = await getFlagQuizWinners()

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">🚩 Flag Quiz</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Name every World Cup country</p>
        </div>
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      </div>

      <FlagQuizClient questions={FLAG_QUESTIONS} winners={winners} />
    </div>
  )
}
