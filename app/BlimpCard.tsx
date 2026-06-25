'use client'

import { useEffect, useState } from 'react'
import { fetchBlimp } from './actions'
import type { BlimpStatus } from '@/lib/blimp'

const EMPTY: BlimpStatus = { dormant: false, dormantSince: null, report: null }

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 90) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function MapLink({ lat, lon }: { lat: number; lon: number }) {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
    >
      view on map 🗺️
    </a>
  )
}

function BlimpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-teal-500 dark:text-teal-400"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* envelope */}
      <ellipse cx="10" cy="9.5" rx="8" ry="4.5" />
      {/* tail fin */}
      <path d="M16 9.5 L21 6 L20 9.5 L21 13 Z" />
      {/* gondola */}
      <rect x="7.5" y="13" width="5" height="2.6" rx="1.3" />
    </svg>
  )
}

export default function BlimpCard() {
  const [status, setStatus] = useState<BlimpStatus | undefined>(undefined) // undefined = loading

  useEffect(() => {
    let alive = true
    const load = () =>
      fetchBlimp()
        .then((s) => {
          if (alive) setStatus(s)
        })
        .catch(() => {
          if (alive) setStatus(EMPTY)
        })
    load()
    const id = setInterval(load, 600000) // refresh every 10 min while open
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const report = status?.report ?? null

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
          <BlimpIcon /> Goodyear Blimp
        </span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">N3A · Wingfoot Three</span>
      </div>

      {status === undefined ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Locating the blimp…</p>
      ) : status.dormant ? (
        // Tracker has been put to sleep for the season.
        <>
          <p className="text-sm text-slate-700 dark:text-slate-200">😴 Blimp tracker is asleep until the next road trip</p>
          {report ? (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Last seen{report.place ? ` near ${report.place}` : ''} on {fmtDate(report.ts)}
              {' · '}
              <MapLink lat={report.lat} lon={report.lon} />
            </p>
          ) : null}
        </>
      ) : report === null ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          🅿️ The blimp is taking a break — check back when it&apos;s flying!
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {report.live ? (
              <>
                <span className="font-bold text-teal-600 dark:text-teal-400">Flying now</span>
                {report.place ? ` near ${report.place}` : ''} 🟢
              </>
            ) : (
              <>Last seen{report.place ? ` near ${report.place}` : ''}</>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {report.altFt != null ? `${report.altFt.toLocaleString()} ft · ` : ''}
            {report.live ? 'live' : `updated ${timeAgo(report.ts)}`}
            {' · '}
            <MapLink lat={report.lat} lon={report.lon} />
          </p>
        </>
      )}
    </div>
  )
}
