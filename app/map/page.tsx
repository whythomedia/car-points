'use client'

import { useState } from 'react'

// Coordinates calibrated from the original SVG viewBox (0 0 1263.5 760.88)
// Reference points: Springtown(613,526), Memphis(767,470), Kansas City(670,377)
// Scale: ~20px/°lon, ~23px/°lat
const STOPS = [
  { name: 'Springtown', x: 613, y: 526, home: true },
  { name: 'New Orleans', x: 765, y: 591 },
  { name: 'Houston', x: 659, y: 594 },
]

// Route: Springtown → New Orleans → Houston → Springtown
const ROUTE = [STOPS[0], STOPS[1], STOPS[2], STOPS[0]]

function routePath(stops: typeof ROUTE) {
  return stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')
}

export default function MapPage() {
  const [showAnimals, setShowAnimals] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  return (
    <div className="min-h-screen px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">The Route</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Springtown → New Orleans → Houston</p>
      </div>

      {/* Toggles */}
      <div className="mb-3 flex gap-4">
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

      {/* Map container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="relative w-full" style={{ paddingBottom: `${(760.88 / 1263.5) * 100}%` }}>

          {/* PNG layers */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/usmap_outlines.png"
            alt="US map"
            className="absolute inset-0 h-full w-full object-fill"
          />
          {showAnimals && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/usmap_animals.png"
              alt=""
              className="absolute inset-0 h-full w-full object-fill"
            />
          )}
          {showLabels && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/usmap_labels.png"
              alt=""
              className="absolute inset-0 h-full w-full object-fill"
            />
          )}

          {/* SVG route overlay */}
          <svg
            viewBox="0 0 1263.5 760.88"
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Route path */}
            <path
              d={routePath(ROUTE)}
              fill="none"
              stroke="#7bccc4"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 6"
            />

            {/* City dots and labels */}
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
                {/* Label background */}
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
        🏠 Home base: Springtown, TX
      </p>
    </div>
  )
}
