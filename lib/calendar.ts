import ICAL from 'ical.js'

// Single published family calendar (iCloud). The URL grants read access, so it
// lives only in the FAMILY_CALENDAR_URL env var — never commit it (public repo).
// webcal:// → https:// since fetch() doesn't speak webcal.
const CAL_URL = (process.env.FAMILY_CALENDAR_URL ?? '').replace(/^webcal:\/\//i, 'https://')

export type CalEvent = {
  id: string
  summary: string
  location: string
  start: Date
  end: Date
  isAllDay: boolean
}

// Ported from the old family-calendar app — the tricky part of ICS parsing:
// - all-day (VALUE=DATE): pin to noon UTC so the date is stable in any timezone
//   (midnight UTC would slip to the previous day in CDT).
// - floating time (no TZID): keep the wall-clock values as UTC.
// - real IANA TZID: let ical.js + Intl convert via toJSDate().
function resolveDate(date: {
  isDate?: boolean
  zone?: { tzid?: string }
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
  toJSDate: () => Date
}): Date {
  if (date.isDate) {
    return new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0))
  }
  if (date.zone?.tzid === 'floating') {
    return new Date(Date.UTC(date.year, date.month - 1, date.day, date.hour ?? 0, date.minute ?? 0, date.second ?? 0))
  }
  return date.toJSDate()
}

// Upcoming events (not yet ended), soonest first, expanding recurrence within a
// horizon. Fails soft to [] so the dashboard never breaks on a calendar hiccup.
export async function getUpcomingEvents(limit = 5, horizonMonths = 4): Promise<CalEvent[]> {
  if (!CAL_URL) return []

  let text: string
  try {
    const res = await fetch(CAL_URL, { next: { revalidate: 900 } }) // refresh at most every 15 min
    if (!res.ok) return []
    text = await res.text()
  } catch {
    return []
  }

  let vevents: ICAL.Component[]
  try {
    vevents = new ICAL.Component(ICAL.parse(text)).getAllSubcomponents('vevent')
  } catch {
    return []
  }

  const now = new Date()
  const horizon = new Date(now)
  horizon.setMonth(horizon.getMonth() + horizonMonths)
  const out: CalEvent[] = []

  vevents.forEach((vevent, i) => {
    let event: ICAL.Event
    try {
      event = new ICAL.Event(vevent)
    } catch {
      return
    }
    const isAllDay = !!(event.startDate as unknown as { isDate?: boolean }).isDate
    const durationMs = event.endDate.toJSDate().getTime() - event.startDate.toJSDate().getTime()

    const add = (start: Date, idx: number) => {
      out.push({
        id: `${event.uid}-${i}-${idx}`,
        summary: event.summary || '(untitled)',
        location: event.location || '',
        start,
        end: new Date(start.getTime() + durationMs),
        isAllDay,
      })
    }

    try {
      if (event.isRecurring()) {
        const it = event.iterator()
        let next: ICAL.Time | null
        let idx = 0
        while ((next = it.next())) {
          const start = resolveDate(next as unknown as Parameters<typeof resolveDate>[0])
          if (start > horizon) break
          if (new Date(start.getTime() + durationMs) >= now) add(start, idx)
          if (++idx > 500) break // safety against unbounded rules
        }
      } else {
        const start = resolveDate(event.startDate as unknown as Parameters<typeof resolveDate>[0])
        if (new Date(start.getTime() + durationMs) >= now && start <= horizon) add(start, 0)
      }
    } catch {
      // skip a malformed event, keep the rest
    }
  })

  out.sort((a, b) => a.start.getTime() - b.start.getTime())
  return out.slice(0, limit)
}

export async function getNextEvent(): Promise<CalEvent | null> {
  return (await getUpcomingEvents(1))[0] ?? null
}
