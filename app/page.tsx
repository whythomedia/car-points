import Image from 'next/image'
import { getKids } from '@/lib/redis'

const AVATARS = ['🐧', '🦓', '🐆', '🐼'] // Owen, Zoe, Max, Emma

export default async function HomePage() {
  const kids = await getKids()

  return (
    <div className="min-h-screen px-4 pt-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Image src="/vaughn_120.png" alt="Vaughn" width={60} height={60} className="rounded-full" />
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Car Points</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Springtown → New Orleans → Houston</p>
        </div>
      </div>

      {/* Kids grid */}
      <div className="grid grid-cols-2 gap-3">
        {kids.map((kid, i) => (
          <div
            key={kid.name}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{AVATARS[i % AVATARS.length]}</span>
              <span className="font-bold text-slate-900 dark:text-white">{kid.name}</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 w-fit dark:bg-teal-900/50">
              <span className="text-2xl font-black text-teal-700 dark:text-teal-300">{kid.points}</span>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{kid.points === 1 ? 'pt' : 'pts'}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Tap <strong className="text-slate-500 dark:text-slate-400">Vault</strong> to solve today&apos;s riddle for +5 pts
      </p>
    </div>
  )
}
