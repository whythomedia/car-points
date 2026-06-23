'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeReadingRound } from '@/app/actions'

type ImageWord = { word: string; emoji: string }
type Mode = 'menu' | 'flash' | 'find' | 'type' | 'done'

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

type FindQ = { target: string; emoji: string; choices: string[] }

export default function ReadingClient({
  words,
  imageWords,
  roundSize,
  choices,
  rewardClaimed,
}: {
  words: string[]
  imageWords: ImageWord[]
  roundSize: number
  choices: number
  rewardClaimed: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('menu')
  const [idx, setIdx] = useState(0)
  const [flashRound, setFlashRound] = useState<string[]>([])
  const [findRound, setFindRound] = useState<FindQ[]>([])
  const [typeRound, setTypeRound] = useState<string[]>([])
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [typed, setTyped] = useState('')
  const [typeWrong, setTypeWrong] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [awarded, setAwarded] = useState<boolean | null>(null)
  const [, startTransition] = useTransition()
  const claimedThisVisit = useRef(rewardClaimed)

  function startFlash() {
    setFlashRound(shuffle(words).slice(0, Math.min(roundSize, words.length)))
    setIdx(0)
    setMode('flash')
    // No autoplay — she reads it herself first, then taps 🔊 if she wants help.
  }

  function startFind() {
    const targets = shuffle(imageWords).slice(0, Math.min(roundSize, imageWords.length))
    const round: FindQ[] = targets.map(({ word, emoji }) => {
      const others = shuffle(imageWords.filter((w) => w.word !== word))
        .slice(0, Math.max(0, choices - 1))
        .map((w) => w.word)
      return { target: word, emoji, choices: shuffle([word, ...others]) }
    })
    setFindRound(round)
    setIdx(0)
    setWrong(new Set())
    setMode('find')
  }

  function startType() {
    const round = shuffle(words).slice(0, Math.min(roundSize, words.length))
    setTypeRound(round)
    setIdx(0)
    setTyped('')
    setTypeWrong(false)
    setReveal(false)
    setMode('type')
    speak(round[0]) // this game plays the word for her
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
    if (next >= flashRound.length) finishRound()
    else setIdx(next)
  }

  function pickChoice(word: string) {
    const q = findRound[idx]
    if (word === q.target) {
      const next = idx + 1
      setWrong(new Set())
      if (next >= findRound.length) finishRound()
      else setIdx(next)
    } else {
      setWrong((prev) => new Set(prev).add(word))
    }
  }

  function submitTyped() {
    const target = typeRound[idx]
    if (typed.trim().toLowerCase() === target.toLowerCase()) {
      const next = idx + 1
      setTyped('')
      setTypeWrong(false)
      setReveal(false)
      if (next >= typeRound.length) finishRound()
      else {
        setIdx(next)
        speak(typeRound[next])
      }
    } else {
      setTypeWrong(true)
    }
  }

  // --- Top bar: back goes up one level (game → Reading menu → Games) ---
  const topBar = (
    <div className="mb-5 flex items-center justify-between">
      {mode === 'menu' ? (
        <Link href="/games" className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
          ← Games
        </Link>
      ) : (
        <button
          onClick={() => setMode('menu')}
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          ← Reading Games
        </button>
      )}
      <span className="text-sm font-bold text-slate-400 dark:text-slate-500">📖 Zoe&apos;s Reading</span>
    </div>
  )

  // --- Menu ---
  if (mode === 'menu') {
    return (
      <div>
        {topBar}
        <h1 className="mb-1 text-2xl font-black text-slate-900 dark:text-white">Reading Games</h1>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
          Finish a round to earn <strong className="text-teal-600 dark:text-teal-400">+5 points</strong> (once a day) —
          then keep going as long as you like!
        </p>
        <div className="space-y-3">
          <GameCard emoji="📖" title="Read the Words" sub="See a word and read it (tap 🔊 for help)" onClick={startFlash} />
          <GameCard emoji="🔎" title="Find the Word" sub="See a picture, tap the word that matches" onClick={startFind} />
          <GameCard emoji="⌨️" title="Type the Word" sub="Hear a word and type it" onClick={startType} />
        </div>
      </div>
    )
  }

  // --- Done ---
  if (mode === 'done') {
    return (
      <div>
        {topBar}
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
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
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button onClick={startFlash} className="rounded-xl bg-teal-600 px-4 py-2.5 font-bold text-white hover:bg-teal-500">📖 Read</button>
            <button onClick={startFind} className="rounded-xl bg-teal-600 px-4 py-2.5 font-bold text-white hover:bg-teal-500">🔎 Find</button>
            <button onClick={startType} className="rounded-xl bg-teal-600 px-4 py-2.5 font-bold text-white hover:bg-teal-500">⌨️ Type</button>
          </div>
        </div>
      </div>
    )
  }

  // --- Flashcards ---
  if (mode === 'flash') {
    const word = flashRound[idx]
    return (
      <div>
        {topBar}
        <Progress idx={idx} total={flashRound.length} />
        <div className="mt-5 flex flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white py-14 dark:border-slate-700 dark:bg-slate-800">
          <span className="px-4 text-center text-6xl font-black tracking-wide text-slate-900 dark:text-white">{word}</span>
          <SpeakerButton word={word} big />
        </div>
        <button onClick={flashNext} className="mt-6 w-full rounded-2xl bg-teal-600 py-4 text-lg font-black text-white hover:bg-teal-500">
          I read it! ✓
        </button>
      </div>
    )
  }

  // --- Find the word (picture → word) ---
  if (mode === 'find') {
    const q = findRound[idx]
    return (
      <div>
        {topBar}
        <Progress idx={idx} total={findRound.length} />
        <div className="mt-5 flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white py-8 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-[5.5rem] leading-none">{q.emoji}</span>
          <SpeakerButton word={q.target} />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3">
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
          <p className="mt-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Try again — you&apos;ve got this! 💪</p>
        )}
      </div>
    )
  }

  // --- Type the word (hear → type) ---
  const target = typeRound[idx]
  return (
    <div>
      {topBar}
      <Progress idx={idx} total={typeRound.length} />
      <div className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white py-10 dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Type the word you hear</span>
        <SpeakerButton word={target} big />
        {reveal && <span className="text-3xl font-black tracking-widest text-slate-400 dark:text-slate-500">{target}</span>}
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value)
            setTypeWrong(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitTyped()
          }}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className={`w-56 rounded-2xl border-2 bg-white px-4 py-3 text-center text-3xl font-black lowercase text-slate-900 outline-none dark:bg-slate-900 dark:text-white ${
            typeWrong ? 'border-orange-300' : 'border-slate-200 focus:border-teal-400 dark:border-slate-600'
          }`}
        />
        {typeWrong && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Not quite — listen again and try! 💪</span>}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setReveal((r) => !r)}
          className="rounded-2xl border-2 border-slate-200 px-5 py-4 font-bold text-slate-600 hover:border-teal-300 dark:border-slate-600 dark:text-slate-300"
        >
          👀 {reveal ? 'Hide' : 'Show me'}
        </button>
        <button onClick={submitTyped} className="flex-1 rounded-2xl bg-teal-600 py-4 text-lg font-black text-white hover:bg-teal-500">
          Check ✓
        </button>
      </div>
    </div>
  )
}

function GameCard({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-teal-700"
    >
      <span className="text-4xl">{emoji}</span>
      <span>
        <span className="block text-lg font-black text-slate-900 dark:text-white">{title}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{sub}</span>
      </span>
    </button>
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
