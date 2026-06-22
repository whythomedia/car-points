import Link from 'next/link'
import { getSpottedStates } from '@/lib/redis'
import { STATES } from '@/lib/games/states'
import PlatesClient from './PlatesClient'

export const metadata = { title: 'License Plate Game' }

export default async function PlatesPage() {
  const spotted = await getSpottedStates()

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">🚗 License Plates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Spot a plate from every state</p>
        </div>
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      </div>

      <PlatesClient states={STATES} spotted={spotted} />
    </div>
  )
}
