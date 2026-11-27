import Link from 'next/link'
import { getCurrentUser } from '@/lib/current-user'
import { getMuseumSave } from '@/lib/redis'
import MuseumClient from './MuseumClient'

export const metadata = { title: 'The Museum' }

export default async function MuseumPage() {
  const me = await getCurrentUser()
  const save = me ? await getMuseumSave(me.name) : null

  return (
    <div className="min-h-screen px-4 pb-12 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">🏛️ The Museum</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Locked in after closing</p>
        </div>
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      </div>

      {me ? (
        // Each person has their own game, so remount if someone else signs in.
        <MuseumClient key={me.name} person={me.name} isKid={me.role === 'kid'} saved={save} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="font-black text-slate-900 dark:text-white">Who&apos;s playing?</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Everyone gets their own game. Pick who you are on the Home page, then come back.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700"
          >
            Go to Home
          </Link>
        </div>
      )}
    </div>
  )
}
