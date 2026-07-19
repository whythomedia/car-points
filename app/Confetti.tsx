'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#109488', '#7bccc4', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']

type Piece = {
  id: number
  x: number
  color: string
  size: number
  duration: number
  rotation: number
  drift: number
}

// Falling-confetti overlay. `fixed` (default) covers the viewport; `contained`
// keeps it inside the nearest positioned parent (make that parent `relative
// overflow-hidden`). `durationMs` stops spawning after a burst; omit for a
// continuous stream.
export default function Confetti({
  contained = false,
  durationMs,
}: {
  contained?: boolean
  durationMs?: number
}) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    let id = 0
    const interval = setInterval(() => {
      setPieces((prev) => {
        const next = prev.filter((p) => p.id > id - 40) // cap live pieces
        return [
          ...next,
          {
            id: id++,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: 8 + Math.random() * 8,
            duration: 2 + Math.random() * 2,
            rotation: Math.random() * 360,
            drift: Math.floor((Math.random() * 2 - 1) * 80),
          },
        ]
      })
    }, 80)

    const timer = durationMs ? setTimeout(() => clearInterval(interval), durationMs) : undefined
    return () => {
      clearInterval(interval)
      if (timer) clearTimeout(timer)
    }
  }, [durationMs])

  const fallEnd = contained ? '120%' : '110vh'

  return (
    <div className={`pointer-events-none ${contained ? 'absolute' : 'fixed'} inset-0 overflow-hidden`}>
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
            ['--drift' as string]: `${p.drift}px`,
            ['--fall-end' as string]: fallEnd,
            animation: `confetti-fall ${p.duration}s linear forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { top: -10px; opacity: 1; transform: rotate(0deg) translateX(0); }
          100% { top: var(--fall-end); opacity: 0; transform: rotate(720deg) translateX(var(--drift)); }
        }
      `}</style>
    </div>
  )
}
