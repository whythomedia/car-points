import { getTodayVaultStatus } from '@/lib/redis'
import { getTodayRiddle } from '@/lib/riddles'
import BonusClient from './BonusClient'

export default async function BonusPage() {
  const [vault, riddle] = await Promise.all([
    getTodayVaultStatus(),
    Promise.resolve(getTodayRiddle()),
  ])

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Daily Vault</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Solve the riddle. Claim 5 points.</p>
      </div>

      {vault.claimed ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 text-5xl">🔒</div>
          <h2 className="mb-1 text-xl font-black text-slate-900 dark:text-white">Vault Claimed!</h2>
          <p className="text-slate-500 dark:text-slate-400">
            <span className="font-bold text-teal-600 dark:text-teal-300">{vault.winner}</span> already cracked it today.
          </p>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Come back tomorrow for a new riddle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Riddle card */}
          <div className="rounded-2xl border border-teal-300 bg-white p-5 dark:border-teal-800 dark:bg-slate-800">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">🧩</span>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Today&apos;s Riddle</span>
            </div>
            <p className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">{riddle.question}</p>
            <p className="mt-3 text-sm text-slate-400 italic dark:text-slate-500">Hint: {riddle.hint}</p>
          </div>

          {/* Form */}
          <BonusClient riddle={riddle} />
        </div>
      )}
    </div>
  )
}
