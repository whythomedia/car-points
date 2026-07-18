import { getUpcomingEvents, type CalEvent } from '@/lib/calendar'

// Dashboard calendar peek: the next few things on the family calendar. Kept
// small on purpose — the full calendar can come later. Fails soft to an empty
// state (getUpcomingEvents already returns [] on any hiccup or missing env var).

const TZ = 'America/Chicago'

// Central-time date key (YYYY-MM-DD) so "today"/"tomorrow" match the wall clock,
// not UTC.
function dayKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

function relativeDay(start: Date, now: Date): string {
  const key = dayKey(start)
  const todayKey = dayKey(now)
  const tomorrow = new Date(now.getTime() + 86400000)
  if (key === todayKey) return 'Today'
  if (key === dayKey(tomorrow)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(start)
}

function timeLabel(ev: CalEvent): string {
  if (ev.isAllDay) return 'All day'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(ev.start)
}

export default async function UpcomingEvents() {
  const events = await getUpcomingEvents(3)
  const now = new Date()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        📅 Coming up
      </p>

      {events.length === 0 ? (
        <p className="py-2 text-sm text-slate-500 dark:text-slate-400">Nothing on the calendar right now.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-start gap-3">
              <div className="min-w-[3.5rem] shrink-0">
                <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{relativeDay(ev.start, now)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{timeLabel(ev)}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{ev.summary}</p>
                {ev.location && (
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{ev.location}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
