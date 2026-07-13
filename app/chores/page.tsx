import Link from 'next/link'
import { KIDS, buildKidBoard, choreToday, getChoreLog } from '@/lib/chores'
import ChoresBoard from './ChoresBoard'

export const metadata = { title: 'Daily Chores' }

export default async function ChoresPage() {
  const today = choreToday()
  const log = await getChoreLog()
  const kids = KIDS.map((k) => buildKidBoard(log, k.name, today))

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">✅ Daily Chores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Check off today · build your streak</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          Home →
        </Link>
      </div>

      <ChoresBoard today={today} kids={kids} />
    </div>
  )
}
