'use client'

import { useState, useTransition } from 'react'
import { checkAdminPassword, updateScore } from '@/app/actions'
import { useRouter } from 'next/navigation'

const KIDS = ['Owen', 'Zoe', 'Max', 'Emma']

function ScoreButton({
  label,
  onClick,
  disabled,
  variant = 'default',
}: {
  label: string
  onClick: () => void
  disabled: boolean
  variant?: 'default' | 'danger' | 'bonus'
}) {
  const styles = {
    default: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
    danger: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/70',
    bonus: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/70',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${styles[variant]}`}
    >
      {label}
    </button>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const ok = await checkAdminPassword(password)
      if (ok) {
        setUnlocked(true)
        setAuthError('')
      } else {
        setAuthError('Wrong password.')
        setPassword('')
      }
    })
  }

  function handleScore(kid: string, delta: number, label: string) {
    startTransition(async () => {
      await updateScore(kid, delta)
      setFeedback((prev) => ({ ...prev, [kid]: label }))
      setTimeout(() => setFeedback((prev) => ({ ...prev, [kid]: '' })), 1500)
    })
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-black text-slate-900 dark:text-white">Admin</h1>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Parents only.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
            />
            {authError && <p className="text-sm text-red-500 dark:text-red-400">{authError}</p>}
            <button
              type="submit"
              disabled={isPending || !password}
              className="w-full rounded-xl bg-teal-600 py-3 font-black text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {isPending ? 'Checking...' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Adjust points per kid</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          View scoreboard →
        </button>
      </div>

      <div className="space-y-3">
        {KIDS.map((kid) => (
          <div key={kid} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">{kid}</span>
              {feedback[kid] && (
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{feedback[kid]}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ScoreButton label="+1"  onClick={() => handleScore(kid, 1,   '+1 ✓')} disabled={isPending} variant="bonus" />
              <ScoreButton label="+5"  onClick={() => handleScore(kid, 5,   '+5 ✓')} disabled={isPending} variant="bonus" />
              <ScoreButton label="+10" onClick={() => handleScore(kid, 10, '+10 ✓')} disabled={isPending} variant="bonus" />
              <ScoreButton label="−1"  onClick={() => handleScore(kid, -1,   '−1')}  disabled={isPending} variant="danger" />
              <ScoreButton label="−5"  onClick={() => handleScore(kid, -5,   '−5')}  disabled={isPending} variant="danger" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
