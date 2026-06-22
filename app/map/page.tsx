'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Stop = { name: string; x: number; y: number; home?: boolean }

// Coordinates are in the map's SVG viewBox space (1263.5 × 760.88), placed by
// eye on the art map. Route: Springtown TX → Albuquerque → LA → Vegas → back.
const HOME: Stop = { name: 'Home', x: 613, y: 526, home: true }
const ABQ: Stop = { name: 'Albuquerque', x: 430, y: 470 }
const LA: Stop = { name: 'Los Angeles', x: 180, y: 495 }
const VEGAS: Stop = { name: 'Las Vegas', x: 250, y: 440 }

const STOPS: Stop[] = [HOME, ABQ, VEGAS, LA]
const ROUTE: Stop[] = [HOME, ABQ, LA, VEGAS, ABQ, HOME]

function routePath(stops: Stop[]) {
  return stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')
}

const VIEW_W = 1263.5
const VIEW_H = 760.88
const MIN_SCALE = 1
const MAX_SCALE = 5

type Transform = { s: number; x: number; y: number }

export default function MapPage() {
  const [showAnimals, setShowAnimals] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [tf, setTf] = useState<Transform>({ s: 1, x: 0, y: 0 })
  const [animating, setAnimating] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const tfRef = useRef(tf)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ cx: number; cy: number; d: number } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)

  // Keep the bounds-clamp aware of the container size.
  const clamp = useCallback((t: Transform): Transform => {
    const el = boxRef.current
    const w = el?.clientWidth ?? 0
    const h = el?.clientHeight ?? 0
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.s))
    const minX = w * (1 - s)
    const minY = h * (1 - s)
    return { s, x: Math.min(0, Math.max(minX, t.x)), y: Math.min(0, Math.max(minY, t.y)) }
  }, [])

  const apply = useCallback(
    (t: Transform) => {
      const c = clamp(t)
      tfRef.current = c
      setTf(c)
    },
    [clamp]
  )

  function rel(e: { clientX: number; clientY: number }) {
    const r = boxRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function metrics() {
    const pts = [...pointers.current.values()]
    const n = pts.length
    const cx = pts.reduce((a, p) => a + p.x, 0) / n
    const cy = pts.reduce((a, p) => a + p.y, 0) / n
    const d = n >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0
    return { cx, cy, d }
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, rel(e))
    gesture.current = pointers.current.size >= 2 ? metrics() : null
    setAnimating(false)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId)!
    const cur = rel(e)
    pointers.current.set(e.pointerId, cur)

    if (pointers.current.size === 1) {
      // Pan
      apply({ s: tfRef.current.s, x: tfRef.current.x + (cur.x - prev.x), y: tfRef.current.y + (cur.y - prev.y) })
    } else if (pointers.current.size >= 2) {
      const m = metrics()
      const base = gesture.current
      if (!base || base.d === 0) {
        gesture.current = m
        return
      }
      const t = tfRef.current
      const dx = m.cx - base.cx
      const dy = m.cy - base.cy
      const newS = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.s * (m.d / base.d)))
      const k = newS / t.s
      // Pan by centroid movement, then zoom about the centroid.
      let x = t.x + dx
      let y = t.y + dy
      x = m.cx - (m.cx - x) * k
      y = m.cy - (m.cy - y) * k
      apply({ s: newS, x, y })
      gesture.current = m
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    gesture.current = pointers.current.size >= 2 ? metrics() : null

    // Double-tap to zoom (only when the gesture was a quick tap).
    if (pointers.current.size === 0) {
      const p = rel(e)
      const now = Date.now()
      const last = lastTap.current
      if (last && now - last.t < 300 && Math.hypot(p.x - last.x, p.y - last.y) < 24) {
        const t = tfRef.current
        const targetS = t.s > 1.2 ? 1 : 2.6
        const k = targetS / t.s
        setAnimating(true)
        apply({ s: targetS, x: p.x - (p.x - t.x) * k, y: p.y - (p.y - t.y) * k })
        lastTap.current = null
      } else {
        lastTap.current = { t: now, x: p.x, y: p.y }
      }
    }
  }

  function reset() {
    setAnimating(true)
    apply({ s: 1, x: 0, y: 0 })
  }

  // Re-clamp if the container resizes (e.g. orientation change).
  useEffect(() => {
    const onResize = () => apply(tfRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [apply])

  const zoomed = tf.s > 1.01

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">The Route</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">California &amp; Back</p>
      </div>

      {/* Layer toggles */}
      <div className="mb-3 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={showAnimals} onChange={(e) => setShowAnimals(e.target.checked)} className="accent-teal-500" />
          Animals
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="accent-teal-500" />
          Labels
        </label>
      </div>

      {/* Map viewport */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-sky-50 dark:border-slate-700 dark:bg-slate-800">
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          className="relative w-full touch-none select-none"
          style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        >
          <div
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})`,
              transition: animating ? 'transform 0.25s ease-out' : 'none',
            }}
            onTransitionEnd={() => setAnimating(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/usmap_outlines.png" alt="US map" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
            {showAnimals && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/usmap_animals.png" alt="" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
            )}
            {showLabels && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/usmap_labels.png" alt="" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
            )}

            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d={routePath(ROUTE)}
                fill="none"
                stroke="#109488"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="9 7"
              />
              {STOPS.map((stop) => (
                <g key={stop.name}>
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r={stop.home ? 9 : 7}
                    fill={stop.home ? '#109488' : '#fff'}
                    stroke={stop.home ? '#7bccc4' : '#109488'}
                    strokeWidth="3"
                  />
                  <rect x={stop.x + 13} y={stop.y - 15} width={stop.name.length * 10 + 14} height={24} rx="5" fill="#109488" />
                  <text x={stop.x + 20} y={stop.y + 2} fill="#fff" fontFamily="Nunito, system-ui, sans-serif" fontSize="15" fontWeight="800">
                    {stop.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Recenter control (iOS-style), only when moved/zoomed */}
        {zoomed && (
          <button
            onClick={reset}
            aria-label="Recenter"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur active:bg-white dark:bg-slate-900/90 dark:text-slate-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Route summary */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {['Springtown', 'Albuquerque', 'Los Angeles', 'Las Vegas', 'Albuquerque', 'Home'].map((name, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-teal-400">→</span>}
            {name}
          </span>
        ))}
      </div>

      <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">Drag to pan · pinch or double-tap to zoom</p>
    </div>
  )
}
