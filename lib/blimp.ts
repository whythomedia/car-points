import { redis } from './redis'

// Blimp positions come exclusively from the external home-desktop tracker via
// the /api/blimp-alert webhook (see recordBlimpSighting). We no longer poll any
// community ADS-B feed — the webhook is the single source of truth.
//
// The Goodyear blimp the kids spotted is N3A ("Wingfoot Three").

const LAST_SEEN_KEY = 'blimp:lastSeen'
const DORMANT_KEY = 'blimp:dormant' // set to an epoch-ms timestamp when the tracker sleeps

// A recent in-flight position counts as "flying now"; after this it ages into
// "last seen" (so a stale fix doesn't claim the blimp is still up).
const FLYING_TTL_MS = 30 * 60 * 1000

export type BlimpReport = {
  lat: number
  lon: number
  altFt: number | null
  place: string | null
  ts: number // epoch ms of the position
  flying?: boolean // was it airborne when this position was reported?
}

// Full status for the homepage card: whether the external tracker has gone to
// sleep, and the best position we have (live, last-seen, or none).
export type BlimpStatus = {
  dormant: boolean
  dormantSince: number | null
  report: (BlimpReport & { live: boolean }) | null
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const j = (await res.json()) as {
      city?: string
      locality?: string
      principalSubdivision?: string
      countryName?: string
    }
    const parts = [j.city || j.locality, j.principalSubdivision].filter(Boolean)
    return parts.join(', ') || j.countryName || null
  } catch {
    return null
  }
}

async function lastSeen(): Promise<(BlimpReport & { live: boolean }) | null> {
  try {
    const last = await redis.get<BlimpReport>(LAST_SEEN_KEY)
    if (last) {
      const live = !!last.flying && Date.now() - last.ts < FLYING_TTL_MS
      return { ...last, live }
    }
  } catch {
    // no cache available
  }
  return null
}

// Full status for the homepage card. Reads only our Redis cache — positions are
// pushed in by the webhook, so there's nothing to fetch here. When the tracker
// is dormant we surface the last-known position so we know where to pick up next
// road trip.
export async function getBlimpReport(): Promise<BlimpStatus> {
  let dormantSince: number | null = null
  try {
    dormantSince = (await redis.get<number>(DORMANT_KEY)) ?? null
  } catch {
    // treat as not dormant
  }
  if (dormantSince) {
    return { dormant: true, dormantSince, report: await lastSeen() }
  }
  return { dormant: false, dormantSince: null, report: await lastSeen() }
}

// Mark the tracker dormant ("gone to sleep") / wake it back up. Called by the
// /api/blimp-alert webhook on shutdown, and cleared on the next real sighting.
export async function setBlimpDormant(ts: number): Promise<void> {
  try {
    await redis.set(DORMANT_KEY, ts)
  } catch {
    // best-effort
  }
}

export async function clearBlimpDormant(): Promise<void> {
  try {
    await redis.del(DORMANT_KEY)
  } catch {
    // best-effort
  }
}

// Record a sighting reported by an external tracker (e.g. the home-desktop
// poller pushing to /api/blimp-alert). Reverse-geocodes and persists it as the
// last-known position so the homepage card shows it. Returns the stored report.
export async function recordBlimpSighting(pos: {
  lat: number
  lon: number
  altFt?: number | null
  ts?: number
  flying?: boolean
}): Promise<BlimpReport> {
  const report: BlimpReport = {
    lat: pos.lat,
    lon: pos.lon,
    altFt: pos.altFt ?? null,
    place: await reverseGeocode(pos.lat, pos.lon),
    ts: pos.ts ?? Date.now(),
    flying: pos.flying ?? false,
  }
  try {
    await redis.set(LAST_SEEN_KEY, report)
  } catch {
    // best-effort cache
  }
  return report
}
