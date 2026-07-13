import { KIDS, buildKidBoard, choreToday, getChoreLog } from '@/lib/chores'
import { getCurrentUser } from '@/lib/current-user'
import ChoresBoard from './ChoresBoard'

export const metadata = { title: 'Daily Chores' }

export default async function ChoresPage() {
  const today = choreToday()
  const [log, me] = await Promise.all([getChoreLog(), getCurrentUser()])
  const boards = KIDS.map((k) => buildKidBoard(log, k.name, today))
  // A signed-in kid sees only their own card; parents (and signed-out) see everyone.
  const kids = me?.role === 'kid' ? boards.filter((b) => b.name === me.name) : boards

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">✅ Daily Chores</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Check off today · build your streak</p>
      </div>

      <ChoresBoard today={today} kids={kids} currentName={me?.name ?? null} />
    </div>
  )
}
