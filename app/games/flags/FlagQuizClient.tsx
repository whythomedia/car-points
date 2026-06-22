'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { completeFlagQuiz } from '@/app/actions'
import { isCorrect, type FlagQuestion } from '@/lib/games/flagquiz'

const KIDS = ['Owen', 'Zoe', 'Max', 'Emma']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlagQuizClient({
  questions,
  winners,
}: {
  questions: FlagQuestion[]
  winners: string[]
}) {
  const router = useRouter()
  const [kid, setKid] = useState<string | null>(null)
  const [order, setOrder] = useState<FlagQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState('')
  const [wrong, setWrong] = useState(false)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState<{ awarded: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  const total = questions.length

  function start(name: string) {
    setKid(name)
    setOrder(shuffle(questions))
    setIdx(0)
    setGuess('')
    setWrong(false)
    setHint(false)
    setDone(null)
  }

  function finish(name: string) {
    startTransition(async () => {
      const r = await completeFlagQuiz(name)
      if (r.awarded) {
        router.push(
          `/celebrate?kid=${encodeURIComponent(name)}&action=${encodeURIComponent('aced the Flag Quiz! +10 🚩')}`
        )
      } else {
        setDone({ awarded: false })
      }
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = order[idx]
    if (!q) return
    if (isCorrect(guess, q)) {
      setGuess('')
      setWrong(false)
      setHint(false)
      const next = idx + 1
      if (next >= order.length) {
        setIdx(next)
        finish(kid!)
      } else {
        setIdx(next)
      }
    } else {
      setWrong(true)
    }
  }

  // --- Start screen ---
  if (kid === null) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Type the country for all {total} flags. Get every one right to earn{' '}
          <strong className="text-teal-600 dark:text-teal-400">+10 points</strong> — once per kid.
        </p>
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Who&apos;s playing?</p>
          <div className="grid grid-cols-2 gap-2">
            {KIDS.map((name) => (
              <button
                key={name}
                onClick={() => start(name)}
                className="rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-800 hover:border-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-teal-600"
              >
                {name}
                {winners.includes(name) && <span className="ml-1 text-xs text-teal-500">🏅</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- Completion screen ---
  if (idx >= order.length) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <span className="text-6xl">🏅</span>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">All {total} flags, nailed it!</h2>
        {isPending ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Saving…</p>
        ) : done && !done.awarded ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {kid}, you already earned your +10 — but that was a great refresher!
          </p>
        ) : null}
        <button
          onClick={() => setKid(null)}
          className="rounded-xl bg-teal-600 px-5 py-2.5 font-bold text-white hover:bg-teal-500"
        >
          Play again
        </button>
      </div>
    )
  }

  // --- Quiz screen ---
  const q = order[idx]
  const progress = Math.round((idx / total) * 100)

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            Playing as <span className="text-teal-600 dark:text-teal-400">{kid}</span>
          </span>
          <span>
            {idx} / {total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Flag */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <Image
          src={`/flags/${q.code}.png`}
          alt="Mystery flag"
          width={120}
          height={120}
          className="rounded-full ring-1 ring-black/15 dark:ring-white/15"
        />
        <form onSubmit={submit} className="w-full space-y-3">
          <input
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value)
              setWrong(false)
            }}
            placeholder="Which country?"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-center text-lg font-semibold text-slate-900 focus:outline-none dark:bg-slate-700 dark:text-white ${
              wrong
                ? 'border-red-300 focus:border-red-400 dark:border-red-700'
                : 'border-slate-200 focus:border-teal-500 dark:border-slate-600'
            }`}
          />
          {wrong && (
            <p className="text-center text-sm font-semibold text-red-500 dark:text-red-400">Not quite — try again!</p>
          )}
          {hint && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Starts with <strong>{q.name[0]}</strong> · {q.name.replace(/[^A-Za-z]/g, '').length} letters
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHint(true)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Hint
            </button>
            <button
              type="submit"
              disabled={!guess.trim()}
              className="flex-1 rounded-xl bg-teal-600 py-3 font-black text-white hover:bg-teal-500 disabled:opacity-50"
            >
              Check
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
