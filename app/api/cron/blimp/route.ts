import { getBlimpReport } from '@/lib/blimp'

// Polled on a schedule (GitHub Actions) every ~15 min so we capture the blimp's
// position even when nobody has the app open. getBlimpReport() refreshes the
// Redis cache as a side effect. Protected by CRON_SECRET when that env var is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const report = await getBlimpReport()
  return Response.json({ ok: true, live: report?.live ?? false, report })
}
