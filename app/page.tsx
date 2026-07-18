import Image from 'next/image'
import { getCurrentUser } from '@/lib/current-user'
import NotifyCard from './NotifyCard'
import SchoolCountdown from './SchoolCountdown'
import UserButton from './UserButton'
import UpcomingEvents from './UpcomingEvents'
import ChoresToday from './ChoresToday'

export default async function HomePage() {
  const me = await getCurrentUser()

  return (
    <div className="min-h-screen px-4 pt-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/vaughn_120.png" alt="Vaughn" width={60} height={60} className="rounded-full" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Family Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Smithlet Summer</p>
          </div>
        </div>
        <UserButton current={me?.name ?? null} />
      </div>

      {/* Dashboard cards */}
      <div className="flex flex-col gap-4">
        <UpcomingEvents />
        <ChoresToday />
        <SchoolCountdown />
      </div>

      {/* Trip alerts — opt into push notifications */}
      <div className="mt-4">
        <NotifyCard />
      </div>
    </div>
  )
}
