'use client'

import { useEffect, useState } from 'react'
import { subscribeToPush, unsubscribeFromPush } from '@/app/actions'

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

type Status =
  | 'loading'
  | 'unsupported'
  | 'needs-install'
  | 'unconfigured'
  | 'off'
  | 'on'
  | 'denied'
  | 'working'

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export default function NotifyCard() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    async function init() {
      const supported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported) {
        // iOS only exposes Push once installed to the home screen.
        const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
        setStatus(iOS && !isStandalone() ? 'needs-install' : 'unsupported')
        return
      }
      if (!VAPID) {
        // Push API is available but the public key didn't make it into the build.
        setStatus('unconfigured')
        return
      }
      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'on' : 'off')
    }
    init().catch(() => setStatus('unsupported'))
  }, [])

  async function enable() {
    setStatus('working')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'off')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID!) as BufferSource,
      })
      await subscribeToPush(JSON.parse(JSON.stringify(sub)))
      setStatus('on')
    } catch {
      setStatus('off')
    }
  }

  async function disable() {
    setStatus('working')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await unsubscribeFromPush(sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('off')
    } catch {
      setStatus('on')
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  const base =
    'mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'

  if (status === 'needs-install') {
    return (
      <div className={base}>
        <span className="text-xl">🔔</span>
        <p className="flex-1 text-slate-600 dark:text-slate-300">
          Add Car Points to your Home Screen (Share → Add to Home Screen), then open it from the
          icon and tap <strong>Turn on</strong> for trip alerts.
        </p>
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className={base}>
        <span className="text-xl">🔔</span>
        <p className="flex-1 text-slate-600 dark:text-slate-300">
          Alerts aren&apos;t set up on this build (missing notification key). Add
          <code className="mx-1 rounded bg-slate-100 px-1 text-xs dark:bg-slate-700">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>
          in Vercel and redeploy.
        </p>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className={base}>
        <span className="text-xl">🔕</span>
        <p className="flex-1 text-slate-600 dark:text-slate-300">
          Alerts are blocked — enable notifications for Car Points in Settings.
        </p>
      </div>
    )
  }

  if (status === 'on') {
    return (
      <div className={base}>
        <span className="text-xl">🔔</span>
        <p className="flex-1 font-semibold text-teal-700 dark:text-teal-300">Trip alerts are on</p>
        <button onClick={disable} className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Turn off
        </button>
      </div>
    )
  }

  return (
    <div className={base}>
      <span className="text-xl">🔔</span>
      <p className="flex-1 text-slate-600 dark:text-slate-300">Get alerts for plates &amp; results</p>
      <button
        onClick={enable}
        disabled={status === 'working'}
        className="rounded-full bg-teal-600 px-4 py-1.5 text-xs font-black text-white hover:bg-teal-500 disabled:opacity-50"
      >
        {status === 'working' ? '…' : 'Turn on'}
      </button>
    </div>
  )
}
