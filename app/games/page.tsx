import Link from 'next/link'
import { getFlagQuizWinners, getSpottedStates } from '@/lib/redis'

export const metadata = { title: 'Games' }

export default async function GamesPage() {
  const [flagWinners, spotted] = await Promise.all([getFlagQuizWinners(), getSpottedStates()])

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Games</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Play to earn points</p>
      </div>

      <div className="space-y-3">
        {/* Daily Riddle */}
        <Link
          href="/bonus"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
        >
          <span className="text-3xl">🧩</span>
          <div className="flex-1">
            <div className="font-black text-slate-900 dark:text-white">Daily Riddle</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Solve today&apos;s riddle</div>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-black text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
            +5
          </span>
        </Link>

        {/* Flag Quiz */}
        <Link
          href="/games/flags"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
        >
          <span className="text-3xl">🚩</span>
          <div className="flex-1">
            <div className="font-black text-slate-900 dark:text-white">Flag Quiz</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Name every World Cup flag
              {flagWinners.length > 0 && (
                <span className="ml-1 text-teal-600 dark:text-teal-400">· {flagWinners.join(', ')} aced it 🏅</span>
              )}
            </div>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-black text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
            +10
          </span>
        </Link>

        {/* License Plate Game */}
        <Link
          href="/games/plates"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
        >
          <span className="text-3xl">🚗</span>
          <div className="flex-1">
            <div className="font-black text-slate-900 dark:text-white">License Plate Game</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Spot a plate from all 50 states</div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {spotted.length}/50
          </span>
        </Link>

        {/* Coming soon */}
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 p-4 opacity-60 dark:border-slate-700">
          <span className="text-3xl">🌍</span>
          <div className="flex-1">
            <div className="font-black text-slate-900 dark:text-white">Country Quiz</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Coming soon</div>
          </div>
        </div>
      </div>
    </div>
  )
}
