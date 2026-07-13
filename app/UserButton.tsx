'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setCurrentUser } from './actions'
import { PEOPLE, personByName } from '@/lib/people'
import { textOn } from '@/lib/worldcup/brand'

// Top-right "who's using this" button. Shows the current user; tapping opens a
// picker modal to switch (or sign out).
export default function UserButton({ current }: { current: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const me = personByName(current)

  function choose(name: string) {
    startTransition(async () => {
      await setCurrentUser(name)
      router.refresh()
      setOpen(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
          me ? '' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        }`}
        style={me ? { backgroundColor: me.color, color: textOn(me.color) } : undefined}
      >
        <span>{me ? me.emoji : '👤'}</span>
        {me ? me.name : 'Sign in'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-8 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-600" />
            <p className="mb-4 text-center font-black text-slate-900 dark:text-white">Who&apos;s using this?</p>
            <div className="grid grid-cols-3 gap-2">
              {PEOPLE.map((p) => {
                const active = p.name === current
                return (
                  <button
                    key={p.name}
                    onClick={() => choose(p.name)}
                    disabled={isPending}
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition disabled:opacity-60"
                    style={{
                      borderColor: active ? p.color : 'transparent',
                      backgroundColor: active ? `${p.color}1a` : undefined,
                    }}
                  >
                    <span className="text-3xl">{p.emoji}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</span>
                  </button>
                )
              })}
            </div>
            {current && (
              <button
                onClick={() => choose('')}
                disabled={isPending}
                className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
