'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setCurrentUser } from './actions'
import { PEOPLE } from '@/lib/people'
import { textOn } from '@/lib/worldcup/brand'

export default function UserSwitcher({ current }: { current: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function pick(name: string) {
    // Tapping the active person again signs out.
    const next = name === current ? '' : name
    startTransition(async () => {
      await setCurrentUser(next)
      router.refresh()
    })
  }

  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Who&apos;s using this?</p>
      <div className="flex flex-wrap gap-2">
        {PEOPLE.map((p) => {
          const active = p.name === current
          return (
            <button
              key={p.name}
              onClick={() => pick(p.name)}
              disabled={isPending}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition disabled:opacity-60 ${
                active ? '' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
              style={active ? { backgroundColor: p.color, color: textOn(p.color) } : undefined}
            >
              <span>{p.emoji}</span>
              {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
