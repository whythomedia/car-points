import Link from 'next/link'
import { getVaultClaimantsToday } from '@/lib/redis'
import { getTodayRiddle } from '@/lib/riddles'
import BonusClient from './BonusClient'

export default async function BonusPage() {
  const [claimants, riddle] = await Promise.all([
    getVaultClaimantsToday(),
    Promise.resolve(getTodayRiddle()),
  ])

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Daily Riddle</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Solve the riddle. Claim 5 points.</p>
        </div>
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      </div>

      {/* Riddle card — always visible */}
      <div className="mb-4 rounded-2xl border border-teal-300 bg-white p-5 dark:border-teal-800 dark:bg-slate-800">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🧩</span>
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Today&apos;s Riddle</span>
        </div>
        <p className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">{riddle.question}</p>
        <p className="mt-3 text-sm italic text-slate-400 dark:text-slate-500">Hint: {riddle.hint}</p>
      </div>

      {/* Claimants */}
      {claimants.length > 0 && (
        <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already claimed: <span className="font-bold text-teal-600 dark:text-teal-300">{claimants.join(', ')}</span>
        </p>
      )}

      {/* Form */}
      <BonusClient riddle={riddle} claimants={claimants} />
    </div>
  )
}
