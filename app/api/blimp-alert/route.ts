import { timingSafeEqual } from 'crypto'
import { recordBlimpSighting } from '@/lib/blimp'
import { sendPushToAll } from '@/lib/push'
import { redis } from '@/lib/redis'

// Inbound webhook for an external blimp tracker (Scott's home-desktop poller).
// It POSTs one event when N3A goes airborne; we turn that into a push + refresh
// the homepage "last seen" card. Auth is a single static bearer token in
// BLIMP_ALERT_SECRET — rotate by changing the env var.

const REG = 'N3A'
const DEDUPE_SECONDS = 900 // ignore repeat pushes for the same event for 15 min

// Control chars (incl. newlines) + DEL. Built via RegExp so the source stays
// pure ASCII (no literal control bytes in the file).
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function clean(s: unknown, max: number): string {
  // Strip control chars so the value is safe to use as plain text.
  return String(s ?? '').replace(CONTROL_CHARS, ' ').trim().slice(0, max)
}

type Pos = { lat: number; lon: number; altFt: number | null }

function parsePos(p: unknown): Pos | null {
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const lat = Number(o.lat)
  const lon = Number(o.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  const altRaw = Number(o.alt_baro)
  return { lat, lon, altFt: Number.isFinite(altRaw) ? altRaw : null }
}

// Build our own notification body from the structured position when we have it,
// so a malformed/hostile `message` can't fully control what's pushed. Fall back
// to the (sanitized) provided message only when there's no usable position.
function buildBody(event: string, place: string | null, pos: Pos | null, message: string): string {
  const loc = place || (pos ? `${pos.lat.toFixed(2)}, ${pos.lon.toFixed(2)}` : null)
  const alt = pos?.altFt != null ? ` · ${Math.round(pos.altFt).toLocaleString()} ft` : ''
  if (event === 'airborne') return loc ? `It's up! Flying near ${loc}${alt}` : message || 'The blimp just went airborne!'
  if (event === 'landed') return loc ? `Back on the ground near ${loc}` : message || 'The blimp has landed.'
  return message || 'Blimp update'
}

export async function POST(request: Request) {
  const secret = process.env.BLIMP_ALERT_SECRET
  if (!secret) {
    // Fail closed: refuse rather than run unauthenticated.
    return Response.json({ ok: false, error: 'not configured' }, { status: 503 })
  }

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !safeEqual(token, secret)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  if (!payload || typeof payload !== 'object') {
    return Response.json({ ok: false, error: 'invalid payload' }, { status: 400 })
  }
  const p = payload as Record<string, unknown>

  const event = clean(p.event, 32).toLowerCase()
  const reg = clean(p.registration, 16).toUpperCase()
  if (!event) return Response.json({ ok: false, error: 'missing event' }, { status: 400 })
  // Scope strictly to the blimp we track; accept-and-ignore anything else.
  if (reg && reg !== REG) return new Response(null, { status: 204 })

  const pos = parsePos(p.position)
  const ts = (typeof p.timestamp === 'string' && Date.parse(p.timestamp)) || Date.now()

  // Whenever we get coordinates, refresh the homepage "last seen" card.
  let place: string | null = null
  if (pos) {
    try {
      const report = await recordBlimpSighting({ ...pos, ts })
      place = report.place
    } catch {
      // non-fatal — still try to notify
    }
  }

  // Only airborne/landed transitions push; periodic "position" events just
  // update the card silently. Dedupe pushes so a network retry can't double-ping.
  if (event === 'airborne' || event === 'landed') {
    let fresh = true
    try {
      const res = await redis.set(`blimp:alert:${event}`, ts, { nx: true, ex: DEDUPE_SECONDS })
      fresh = res === 'OK'
    } catch {
      fresh = true // Redis hiccup → err toward delivering
    }
    if (fresh) {
      try {
        await sendPushToAll({
          title: '🛩️ Goodyear Blimp',
          body: buildBody(event, place, pos, clean(p.message, 180)),
          url: '/',
          tag: 'blimp',
        })
      } catch {
        // never let a push failure turn into a 500
      }
    }
  }

  return new Response(null, { status: 204 })
}
