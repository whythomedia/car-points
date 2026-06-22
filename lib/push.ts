import webpush from 'web-push'
import { getPushSubscriptions, removePushSubscriptions, type PushSub } from './redis'

// Configure VAPID from env. Missing keys → push is simply disabled (the app
// still works; notifications just don't send).
const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:trip@carpoints.app'

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  if (!PUBLIC || !PRIVATE) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)
  configured = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

// Send a notification to every subscribed device. Never throws; prunes
// subscriptions that have expired (404/410). Returns how many were delivered.
export async function sendPushToAll(payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0
  const subs = await getPushSubscriptions()
  if (subs.length === 0) return 0

  const data = JSON.stringify(payload)
  const dead: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (sub: PushSub) => {
      try {
        await webpush.sendNotification(sub, data)
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) dead.push(sub.endpoint)
      }
    })
  )

  await removePushSubscriptions(dead)
  return sent
}

export async function notifyStateSpotted(stateName: string, count: number, total: number): Promise<void> {
  await sendPushToAll({
    title: '🚗 New license plate!',
    body:
      count >= total
        ? `${stateName} completes all ${total} states! 🎉`
        : `Someone spotted ${stateName} — ${count}/${total} states found`,
    url: '/games/plates',
    tag: 'plates',
  })
}

export async function notifyResult(
  matchLabel: string,
  leaderboard: { name: string; points: number }[]
): Promise<void> {
  const standings = leaderboard
    .slice(0, 4)
    .map((r) => `${r.name} ${r.points}`)
    .join(' · ')
  await sendPushToAll({
    title: `⚽ Final: ${matchLabel}`,
    body: standings ? `Leaderboard — ${standings}` : 'Tap to see the updated picks.',
    url: '/worldcup/picks',
    tag: 'leaderboard',
  })
}
