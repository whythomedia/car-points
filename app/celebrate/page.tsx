'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'

const COLORS = ['#109488', '#7bccc4', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']

type Piece = {
  id: number
  x: number
  color: string
  size: number
  duration: number
  delay: number
  rotation: number
}

function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    let id = 0
    const spawn = () => {
      setPieces((prev) => {
        const next = prev.filter((p) => p.id > id - 40)
        return [
          ...next,
          {
            id: id++,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: 8 + Math.random() * 8,
            duration: 2 + Math.random() * 2,
            delay: 0,
            rotation: Math.random() * 360,
          },
        ]
      })
    }
    const interval = setInterval(spawn, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `fall ${p.duration}s linear forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0%   { top: -10px; opacity: 1; transform: rotate(0deg) translateX(0); }
          100% { top: 110vh; opacity: 0; transform: rotate(720deg) translateX(${Math.random() > 0.5 ? '' : '-'}${Math.floor(Math.random() * 80)}px); }
        }
      `}</style>
    </div>
  )
}

function CelebrateContent() {
  const params = useSearchParams()
  const kid = params.get('kid') ?? 'Someone'
  const action = params.get('action') ?? 'earned points!'

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Confetti />
      <div className="relative z-10">
        <div className="mb-4 text-7xl">🎉</div>
        <h1 className="mb-2 text-4xl font-black text-white">{kid}!</h1>
        <p className="mb-8 text-xl font-semibold text-teal-300">{action}</p>
        <Link
          href="/"
          className="rounded-full bg-teal-600 px-8 py-3 font-bold text-white transition-colors hover:bg-teal-500"
        >
          See the scoreboard
        </Link>
      </div>
    </div>
  )
}

export default function CelebratePage() {
  return (
    <Suspense>
      <CelebrateContent />
    </Suspense>
  )
}
