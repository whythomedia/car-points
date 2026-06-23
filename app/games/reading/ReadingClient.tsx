'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeReadingRound } from '@/app/actions'
import type { SightWord } from '@/lib/games/sightwords'

type Mode = 'menu' | 'flash' | 'find' | 'done'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.8 // a touch slow for a new reader
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

function SpeakerButton({ word, big }: { word: string; big?: boolean }) {
  return (
    <button
      onClick={() => speak(word)}
      aria-label="Hear the word"
      className={`flex items-center justify-center rounded-full bg-teal-100 text-teal-700 active:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-300 ${
        big ? 'h-16 w-16 text-3xl' : 'h-11 w-11 text-xl'
      }`}
    >
      🔊
    </button>
  )
}

type FindQ = { target: string; choices: string[] }

export default function ReadingClient({
  words,
  roundSize,
  choices,
  rewardClaimed,
}: {
  words: SightWord[]
  roundSize: number
  choices: number
  rewardClaimed: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('menu')
  const [idx, setIdx] = useState(0)
  const [flashRound, setFlashRound] = useState<string[]>([])
  const [findRound, setFindRound] = useState<FindQ[]>([])
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [awarded, setAwarded] = useState<boolean | null>(null)
  const [, startTransition] = useTransition()
  const claimedThisVisit = useRef(rewardClaimed)

  const pool = words.map((w) => w.word)

  function startFlash() {
    const round = shuffle(pool).slice(0, Math.min(roundSize, pool.length))
    setFlashRound(round)
    setIdx(0)
    setMode('flash')
    speak(round[0])
  }

  function startFind() {
    const targets = shuffle(pool).slice(0, Math.min(roundSize, pool.length))
    const round: FindQ[] = targets.map((target) => {
      const others = shuffle(pool.filter((w) => w !== target)).slice(0, Math.max(0, choices - 1))
      return { target, choices: shuffle([target, ...others]) }
    })
    setFindRound(round)
    setIdx(0)
    setWrong(new Set())
    setMode('find')
    speak(round[0].target)
  }

  function finishRound() {
    setMode('done')
    if (claimedThisVisit.current) {
      setAwarded(false)
      return
    }
    startTransition(async () => {
      const res = await completeReadingRound()
      claimedThisVisit.current = true
      setAwarded(res.awarded)
      router.refresh()
    })
  }

  function flashNext() {
    const next = idx + 1
    if (next >= flashRound.length) {
      finishRound()
    } else {
      setIdx(next)
      speak(flashRound[next])
    }
  }

  function pickChoice(word: string) {
    const q = findRound[idx]
    if (word === q.target) {
      const next = idx + 1
      setWrong(new Set())
      if (next >= findRound.length) {
        finishRound()
      } else {
        setIdx(next)
        speak(findRound[next].target)
      }
    } else {
      setWrong((prev) => new Set(prev).add(word))
    }
  }

  // --- Menu ---
  if (mode === 'menu') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Pick a way to practice. Finish a round to earn{' '}
          <strong className="text-teal-600 dark:text-teal-400">+5 points</strong> (once a day) — then
          keep going as long as you like!
        </p>
        <button
          onClick={startFlash}
          className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
        >
          <span className="text-4xl">📖</span>
          <span>
            <span className="block text-lg font-black text-slate-900 dark:text-white">Read the Words</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">See a word, read it, tap to hear it</span>
          </span>
        </button>
        <button
          onClick={startFind}
          className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
        >
          <span className="text-4xl">🔎</span>
          <span>
            <span className="block text-lg font-black text-slate-900 dark:text-white">Find the Word</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Hear a word and tap the one that matches</span>
          </span>
        </button>
      </div>
    )
  }

  // --- Done ---
  if (mode === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <span className="text-6xl">🌟</span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Great reading, Zoe!</h2>
        {awarded === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Saving…</p>
        ) : awarded ? (
          <p className="text-lg font-bold text-teal-600 dark:text-teal-400">+5 points! 🎉</p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You already earned today&apos;s points — keep practicing!
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <button onClick={startFlash} className="rounded-xl bg-teal-600 px-5 py-2.5 font-bold text-white hover:bg-teal-500">
            📖 Read again
          </button>
          <button onClick={startFind} className="rounded-xl bg-teal-600 px-5 py-2.5 font-bold text-white hover:bg-teal-500">
            🔎 Find again
          </button>
        </div>
        <button onClick={() => setMode('menu')} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Back
        </button>
      </div>
    )
  }

  const total = mode === 'flash' ? flashRound.length : findRound.length

  // --- Flashcards ---
  if (mode === 'flash') {
    const word = flashRound[idx]
    return (
      <div className="space-y-6">
        <Progress idx={idx} total={total} />
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white py-14 dark:border-slate-700 dark:bg-slate-800">
          <span className="px-4 text-center text-6xl font-black tracking-wide text-slate-900 dark:text-white">{word}</span>
          <SpeakerButton word={word} big />
        </div>
        <button
          onClick={flashNext}
          className="w-full rounded-2xl bg-teal-600 py-4 text-lg font-black text-white hover:bg-teal-500"
        >
          I read it! ✓
        </button>
      </div>
    )
  }

  // --- Find the word ---
  const q = findRound[idx]
  return (
    <div className="space-y-6">
      <Progress idx={idx} total={total} />
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white py-8 dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Find this word</span>
        <span className="text-4xl font-black tracking-wide text-slate-900 dark:text-white">{q.target}</span>
        <SpeakerButton word={q.target} big />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {q.choices.map((c) => {
          const isWrong = wrong.has(c)
          return (
            <button
              key={c}
              onClick={() => pickChoice(c)}
              disabled={isWrong}
              className={`rounded-2xl border-2 py-5 text-3xl font-black transition ${
                isWrong
                  ? 'border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-teal-400 active:bg-teal-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
      {wrong.size > 0 && (
        <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Try again — you&apos;ve got this! 💪</p>
      )}
    </div>
  )
}

function Progress({ idx, total }: { idx: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all ${
            i < idx ? 'w-2.5 bg-teal-500' : i === idx ? 'w-6 bg-teal-500' : 'w-2.5 bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}
