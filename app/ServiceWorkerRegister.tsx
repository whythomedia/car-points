'use client'

import { useEffect } from 'react'

// Registers the service worker on every page load so offline caching works
// app-wide (not only after the user enables notifications). Production only —
// keeps local `npm run dev` free of stale-cache surprises.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
