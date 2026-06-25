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
    <svg viewBox="0 0 117 79" className="h-7 w-auto shrink-0" fill="none" aria-hidden="true">
      <path
        fill="#14b8a6"
        stroke="#000"
        strokeWidth="2"
        d="M62.938 6.879c-16.142 0-30.239 2.948-40.262 7.666-10.091 4.75-15.738 11.122-15.738 17.834 0 6.736 5.307 13.1 15.183 17.837 9.827 4.713 23.919 7.663 40.817 7.663 20.435 0 33.727-2.963 41.878-7.63 8.07-4.621 11.122-10.919 11.122-17.87 0-3.54-.635-6.857-2.206-9.85-1.568-2.988-4.101-5.714-7.992-8.029-7.826-4.654-21.102-7.621-42.802-7.621Z"
      />
      <path
        fill="#d9d9d9"
        stroke="#000"
        strokeWidth="2"
        d="M14.976 1.024a66 66 0 0 0-5.472.08c-1.934.107-3.82.297-5.298.577-.74.14-1.348.297-1.795.465-.494.186-.628.325-.628.325-.05.069-.172.33-.297.898a17 17 0 0 0-.291 1.996c-.152 1.577-.212 3.518-.19 5.418.02 1.901.122 3.731.284 5.085.081.683.173 1.21.268 1.555q.01.034.02.062c4.41.95 6.88 2.605 8.254 4.156.544.614.905 1.2 1.144 1.697L27.808 12.42l-.027-.111a26 26 0 0 0-.541-1.864c-.497-1.491-1.19-3.04-2.01-3.86-3.012-3.012-4.401-4.343-7.112-5.259-.155-.052-.508-.12-1.09-.179a30 30 0 0 0-2.052-.123ZM1.653 17.7q.017.029 0 0ZM9.19 42H32c-1.462 4.667-6.395 12.466-9.124 12.932-3.411.584-19.721-2.748-21.67-4.498-1.56-1.4 6.197-6.878 7.983-8.434ZM55.438 66.879l-8.5-10s10.35 1.012 17 1c6.455-.011 16.5-1 16.5-1 .167 5.833.2 19.2-1 20-1.5 1-23 1-24-1-.25-.5 0-6.5 0-9Z"
      />
      <path
        fill="#d9d9d9"
        stroke="#000"
        strokeWidth="2"
        d="m55.438 66.879-8.5-10s10.35 1.012 17 1c6.455-.011 16.5-1 16.5-1 .167 5.833.2 19.2-1 20-1.5 1-23 1-24-1-.25-.5 0-6.5 0-9Z"
      />
      <path
        fill="#14b8a6"
        stroke="#000"
        strokeWidth="2"
        d="M55.111 75.444c-.25-.5 0-6.5 0-9 9.5-1 25.056 0 25.056 0 0 4.94-.367 9.541-1.056 10-1.5 1-23 1-24-1Z"
      />
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
