// Standalone test of the blimp lookup the app uses (no app/env needed).
// Run: node scripts/blimp-test.mjs   (Node 18+; uses global fetch)

const REG = process.argv[2] || 'N3A'
const ENDPOINTS = [
  `https://api.adsb.lol/v2/reg/${REG}`,
  `https://opendata.adsb.fi/api/v2/reg/${REG}`,
]

console.log(`Looking up registration: ${REG}\n`)

for (const url of ENDPOINTS) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'car-points/1.0 (family road-trip app)' },
    })
    console.log(`${url}\n  HTTP ${res.status}`)
    if (!res.ok) {
      console.log(`  body: ${(await res.text()).slice(0, 200)}\n`)
      continue
    }
    const data = await res.json()
    const list = Array.isArray(data.ac) ? data.ac : null
    console.log(`  ac count: ${list ? list.length : '(no "ac" field — keys: ' + Object.keys(data).join(', ') + ')'}`)
    const ac = list?.find((a) => typeof a.lat === 'number' && typeof a.lon === 'number')
    if (ac) {
      console.log(`  ✅ position: lat=${ac.lat} lon=${ac.lon} alt_baro=${ac.alt_baro}`)
      console.log(`  raw aircraft:\n${JSON.stringify(ac, null, 2)}`)
    } else if (list?.length) {
      console.log(`  ⚠️  aircraft present but no numeric lat/lon. First entry:`)
      console.log(JSON.stringify(list[0], null, 2))
    } else {
      console.log(`  ℹ️  no aircraft returned — N3A isn't broadcasting right now.`)
    }
    console.log('')
  } catch (e) {
    console.log(`${url}\n  ERROR: ${e.message}\n`)
  }
}
