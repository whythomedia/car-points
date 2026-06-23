// Service worker for Car Points: web push + offline app-shell caching.

const CACHE = 'car-points-v1'
// Best-effort precache so a cold offline launch still has the shell.
const PRECACHE = ['/', '/games', '/games/reading', '/manifest.json', '/vaughn_152.png', '/vaughn_120.png', '/vaughn_80.png']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Don't fail the install if one of these can't be fetched.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    )
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return // never cache server actions / POSTs

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // skip cross-origin (fonts, etc.)

  // Keep local dev clean — no caching, always hit the network.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return

  // Hashed Next.js build assets are immutable: cache-first is safe and fast.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
            return res
          })
      )
    )
    return
  }

  // Everything else (pages, data): network-first, fall back to cache offline.
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req)
        caches.open(CACHE).then((c) => c.put(req, fresh.clone())).catch(() => {})
        return fresh
      } catch {
        const cached = await caches.match(req)
        if (cached) return cached
        if (req.mode === 'navigate') {
          const shell = (await caches.match('/games/reading')) || (await caches.match('/'))
          if (shell) return shell
        }
        throw new Error('offline and not cached')
      }
    })()
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Car Points', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Car Points'
  const options = {
    body: data.body || '',
    icon: '/vaughn_152.png',
    badge: '/vaughn_80.png',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
