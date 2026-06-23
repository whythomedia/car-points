import { redis } from './redis'

// The Goodyear blimp the kids spotted. N1A/N2A/N3A are the three Wingfoot
// airships; N3A is "Wingfoot Three".
const REG = 'N3A'

// Free, keyless community ADS-B feeds (tried in order). They only return an
// aircraft while it's airborne and broadcasting, so we cache the last hit.
const ENDPOINTS = [
  `https://api.adsb.lol/v2/reg/${REG}`,
  `https://opendata.adsb.fi/api/v2/reg/${REG}`,
]

export type BlimpReport = {
  lat: number
  lon: number
  altFt: number | null
  place: string | null
  ts: number // epoch ms of the position
}

type AdsbAircraft = {
  lat?: number
  lon?: number
  alt_baro?: number | string
}

async function fetchLive(): Promise<BlimpReport | null> {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'car-points/1.0 (family road-trip app)' },
        next: { revalidate: 120 },
      })
      if (!res.ok) continue
      const data = (await res.json()) as { ac?: AdsbAircraft[]; now?: number }
      const ac = data.ac?.find((a) => typeof a.lat === 'number' && typeof a.lon === 'number')
      if (!ac) continue
      return {
        lat: ac.lat as number,
        lon: ac.lon as number,
        altFt: typeof ac.alt_baro === 'number' ? ac.alt_baro : null,
        place: null,
        ts: typeof data.now === 'number' ? data.now : Date.now(),
      }
    } catch {
      // try the next feed
    }
  }
  return null
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
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

// Returns the blimp's position. `live` = currently broadcasting; otherwise it's
// the last position we saw (persisted in Redis).
export async function getBlimpReport(): Promise<(BlimpReport & { live: boolean }) | null> {
  const live = await fetchLive()
  if (live) {
    live.place = await reverseGeocode(live.lat, live.lon)
    try {
      await redis.set('blimp:lastSeen', live)
    } catch {
      // best-effort cache
    }
    return { ...live, live: true }
  }
  try {
    const last = await redis.get<BlimpReport>('blimp:lastSeen')
    if (last) return { ...last, live: false }
  } catch {
    // no cache available
  }
  return null
}
