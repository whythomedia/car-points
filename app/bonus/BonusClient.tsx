'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { submitVaultAnswer } from '@/app/actions'
import type { Riddle } from '@/lib/riddles'

const KIDS = ['Owen', 'Zoe', 'Max', 'Emma']

export default function BonusClient({ riddle }: { riddle: Riddle }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [kid, setKid] = useState(KIDS[0])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitVaultAnswer(kid, answer)
      if (result.success) {
        router.push(`/celebrate?kid=${encodeURIComponent(kid)}&action=${encodeURIComponent('cracked the vault! +5 pts 🔐')}`)
      } else {
        setError(result.error ?? 'Try again!')
        setAnswer('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Kid selector */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">Who are you?</label>
        <div className="grid grid-cols-2 gap-2">
          {KIDS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setKid(name)}
              className={`rounded-xl border py-2 font-bold transition-colors ${
                kid === name
                  ? 'border-teal-500 bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Answer */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-500 dark:text-slate-400">Your answer</label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          required
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !answer.trim()}
        className="w-full rounded-xl bg-teal-600 py-3 font-black text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
      >
        {isPending ? 'Checking...' : 'Submit Answer 🔐'}
      </button>
    </form>
  )
}
