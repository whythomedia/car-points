import { sendPushToAll } from '@/lib/push'
import { choreToday } from '@/lib/chores'
import { SCHOOL_START } from '@/app/SchoolCountdown'

// Morning chore reminder. Triggered by a GitHub Actions schedule at 10:00 CT on
// weekdays. Guards here too (weekday + before school) so a stray call can't push
// on a weekend or after school starts. Auth via CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ ok: false, error: 'not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const today = choreToday()
  const dow = new Date(today + 'T12:00:00Z').getUTCDay() // 0 Sun … 6 Sat
  const isWeekday = dow >= 1 && dow <= 5
  const beforeSchool = today < SCHOOL_START
  if (!isWeekday || !beforeSchool) {
    return Response.json({ ok: true, skipped: true, today })
  }

  const sent = await sendPushToAll({
    title: '🧹 Chore time!',
    body: "Good morning! Tap to check off today's chores.",
    url: '/chores',
    tag: 'chores',
  })
  return Response.json({ ok: true, sent, today })
}
