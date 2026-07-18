// Backfill / correct a chore record via the admin API.
//
//   node scripts/set-chore.mjs <YYYY-MM-DD> <Kid> <task,task,...>
//   node scripts/set-chore.mjs 2026-07-17 Max read,mow,art
//   node scripts/set-chore.mjs 2026-07-17 Max ""      # clears the day
//
// Env required:  APP_URL (e.g. https://car.smithlets.net), CLAUDE_KEY (or CRON_SECRET)
//
// Task ids: shared = workout, outside, read, art, room, laundry
//           individual = Owen:weeds  Zoe:table  Max:mow  Emma:roomba

const [date, kid, tasksArg = ''] = process.argv.slice(2)
if (!date || !kid) {
  console.error('usage: set-chore.mjs <YYYY-MM-DD> <Kid> <task,task,...>')
  process.exit(1)
}

const base = process.env.APP_URL
const secret = process.env.CLAUDE_KEY || process.env.CRON_SECRET
if (!base || !secret) {
  console.error('Set APP_URL and CLAUDE_KEY (or CRON_SECRET) env vars first.')
  process.exit(1)
}

const taskIds = tasksArg
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const res = await fetch(`${base.replace(/\/$/, '')}/api/admin/chores`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
  body: JSON.stringify({ date, kid, taskIds }),
})
const json = await res.json().catch(() => ({}))
console.log(res.status, JSON.stringify(json))
if (!res.ok) process.exit(1)
