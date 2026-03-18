'use client'

import { useState } from 'react'

const STOPS = [
  { name: 'Home', x: 613, y: 526, home: true },
  { name: 'New Orleans', x: 765, y: 591 },
]

// Route: Home → New Orleans → Home
const ROUTE = [STOPS[0], STOPS[1], STOPS[0]]

function routePath(stops: typeof ROUTE) {
  return stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')
}

const ZOOM_LEVELS = [1, 1.5, 2, 2.5]

export default function MapPage() {
  const [showAnimals, setShowAnimals] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [zoomIdx, setZoomIdx] = useState(0)
  const zoom = ZOOM_LEVELS[zoomIdx]

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">The Route</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">New Orleans &amp; Back</p>
      </div>

      {/* Controls row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showAnimals}
              onChange={(e) => setShowAnimals(e.target.checked)}
              className="accent-teal-500"
            />
            Animals
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="accent-teal-500"
            />
            Labels
          </label>
        </div>

        {/* Zoom buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >−</button>
          <span className="w-10 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-600 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >+</button>
        </div>
      </div>

      {/* Map container — scrollable when zoomed */}
      <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700" style={{ maxHeight: '62vh' }}>
        <div
          className="relative"
          style={{
            width: `${zoom * 100}%`,
            paddingBottom: `${(760.88 / 1263.5) * zoom * 100}%`,
            minWidth: '100%',
          }}
        >
          {/* PNG layers */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/usmap_outlines.png" alt="US map" className="absolute inset-0 h-full w-full object-fill" />
          {showAnimals && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/usmap_animals.png" alt="" className="absolute inset-0 h-full w-full object-fill" />
          )}
          {showLabels && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/usmap_labels.png" alt="" className="absolute inset-0 h-full w-full object-fill" />
          )}

          {/* SVG route overlay */}
          <svg
            viewBox="0 0 1263.5 760.88"
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={routePath(ROUTE)}
              fill="none"
              stroke="#7bccc4"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 6"
            />
            {STOPS.map((stop) => (
              <g key={stop.name}>
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={stop.home ? 8 : 6}
                  fill={stop.home ? '#109488' : '#fff'}
                  stroke={stop.home ? '#7bccc4' : '#000'}
                  strokeWidth="2"
                />
                <rect
                  x={stop.x + 12}
                  y={stop.y - 14}
                  width={stop.name.length * 11 + 10}
                  height={22}
                  rx="4"
                  fill="#109488"
                />
                <text
                  x={stop.x + 17}
                  y={stop.y + 3}
                  fill="#fff"
                  fontFamily="Nunito, system-ui, sans-serif"
                  fontSize="14"
                  fontWeight="800"
                >
                  {stop.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Scroll or zoom to explore the map
      </p>
    </div>
  )
}
