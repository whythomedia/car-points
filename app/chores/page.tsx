import Link from 'next/link'
import { KIDS, buildKidBoard, choreToday, getChoreLog } from '@/lib/chores'
import { getCurrentUser } from '@/lib/current-user'
import ChoresBoard from './ChoresBoard'

export const metadata = { title: 'Daily Chores' }

export default async function ChoresPage() {
  const today = choreToday()
  const [log, me] = await Promise.all([getChoreLog(), getCurrentUser()])
  const boards = KIDS.map((k) => buildKidBoard(log, k.name, today))
  // Float the signed-in kid's card to the top.
  const kids = me ? [...boards].sort((a, b) => Number(b.name === me.name) - Number(a.name === me.name)) : boards

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

      <ChoresBoard today={today} kids={kids} currentName={me?.name ?? null} />
    </div>
  )
}
