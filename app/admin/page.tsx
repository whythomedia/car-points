'use client'

import { useState, useTransition } from 'react'
import {
  adjustReadingLevel,
  checkAdminPassword,
  getReadingProgress,
  sendAdminMessage,
  updateScore,
  type ReadingProgress,
} from '@/app/actions'
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
  const [message, setMessage] = useState('')
  const [msgFeedback, setMsgFeedback] = useState('')
  const [reading, setReading] = useState<ReadingProgress | null>(null)
  const [isPending, startTransition] = useTransition()

  function loadReading(pw: string) {
    getReadingProgress(pw).then((res) => {
      if (res.ok && res.progress) setReading(res.progress)
    })
  }

  function handleAdjustReading(dir: 'add' | 'remove') {
    startTransition(async () => {
      const res = await adjustReadingLevel(password, dir)
      if (res.ok && res.progress) setReading(res.progress)
    })
  }

  function handleSendMessage() {
    startTransition(async () => {
      const res = await sendAdminMessage(password, message)
      if (res.ok) {
        setMessage('')
        setMsgFeedback(res.sent ? `Sent to ${res.sent} device${res.sent === 1 ? '' : 's'} ✓` : 'No devices subscribed yet')
      } else {
        setMsgFeedback(res.error ?? 'Could not send.')
      }
      setTimeout(() => setMsgFeedback(''), 3000)
    })
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const ok = await checkAdminPassword(password)
      if (ok) {
        setUnlocked(true)
        setAuthError('')
        loadReading(password)
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

      {/* Broadcast a message */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white">📣 Send a message</span>
          {msgFeedback && (
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">{msgFeedback}</span>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Pushes to everyone who turned on alerts (also handy as a test).
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Lunch in 10 minutes! 🍔"
          rows={2}
          maxLength={140}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={isPending || !message.trim()}
          className="mt-2 w-full rounded-xl bg-teal-600 py-3 font-black text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Send to all devices'}
        </button>
      </div>

      {/* Zoe's reading progress */}
      {reading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white">📖 Zoe&apos;s reading</span>
            <button
              onClick={() => loadReading(password)}
              className="text-sm text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
            >
              Refresh ↻
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Practicing <strong>{reading.count}</strong> word{reading.count === 1 ? '' : 's'}. Add the next word when
            she&apos;s ready.
          </p>
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => handleAdjustReading('remove')}
              disabled={isPending || reading.count <= 1}
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              − Remove last
            </button>
            <button
              onClick={() => handleAdjustReading('add')}
              disabled={isPending || !reading.nextWord}
              className="flex-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-40 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
            >
              {reading.nextWord ? `+ Add “${reading.nextWord}”` : 'All words added'}
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {reading.rows.map((r) => {
              const total = r.correct + r.wrong
              const pct = total ? Math.round((100 * r.correct) / total) : null
              return (
                <div key={r.word} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{r.word}</span>
                  {total === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">not tried yet</span>
                  ) : (
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{r.correct}✓</span>
                      <span className="font-bold text-orange-500 dark:text-orange-400">{r.wrong}✗</span>
                      <span className="w-10 text-right text-slate-400 dark:text-slate-500">{pct}%</span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
