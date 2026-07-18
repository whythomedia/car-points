import { KIDS, getChoreLog, setChoreRecord } from '@/lib/chores'

// Admin backfill for chore records. Secret-gated (CRON_SECRET), fail-closed.
// Narrow scope: it can only read/write the chores log — nothing else.
//
//   GET  /api/admin/chores?date=YYYY-MM-DD&kid=Name  -> that record
//   GET  /api/admin/chores                            -> the whole log
//   POST /api/admin/chores  { date, kid, taskIds }    -> overwrite a record

function authError(request: Request): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return Response.json({ ok: false, error: 'not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(request: Request) {
  const denied = authError(request)
  if (denied) return denied

  const url = new URL(request.url)
  const date = url.searchParams.get('date')
  const kid = url.searchParams.get('kid')
  const log = await getChoreLog()
  if (date && kid) {
    return Response.json({ ok: true, date, kid, taskIds: log[date]?.[kid] ?? [] })
  }
  return Response.json({ ok: true, log })
}

export async function POST(request: Request) {
  const denied = authError(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  const b = (body ?? {}) as Record<string, unknown>
  const date = String(b.date ?? '')
  const kid = String(b.kid ?? '')
  const taskIds = Array.isArray(b.taskIds) ? b.taskIds.map(String) : null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ ok: false, error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }
  if (!KIDS.some((k) => k.name === kid)) {
    return Response.json({ ok: false, error: `unknown kid (expected one of ${KIDS.map((k) => k.name).join(', ')})` }, { status: 400 })
  }
  if (!taskIds) {
    return Response.json({ ok: false, error: 'taskIds must be an array' }, { status: 400 })
  }

  const applied = await setChoreRecord(kid, date, taskIds)
  return Response.json({ ok: true, date, kid, taskIds: applied })
}
