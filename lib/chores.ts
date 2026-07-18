import { redis } from './redis'
import { KID_PEOPLE } from './people'

// Summer daily chores. All tasks are simple daily checkboxes; completion is
// tracked over time and shown as a GitHub-style contribution grid. No points —
// the chart and streaks are the reward.

export type Task = { id: string; label: string; emoji: string }
export type Kid = { name: string; emoji: string; color: string }

// Roster comes from the canonical people list (kids only).
export const KIDS: Kid[] = KID_PEOPLE.map((p) => ({ name: p.name, emoji: p.emoji, color: p.color }))

export const SHARED_TASKS: Task[] = [
  { id: 'workout', label: 'Work Out', emoji: '💪' },
  { id: 'outside', label: 'Play Outside', emoji: '🌳' },
  { id: 'read', label: 'Read', emoji: '📖' },
  { id: 'art', label: 'Art Project', emoji: '🎨' },
  { id: 'room', label: 'Clean Room', emoji: '🧹' },
  { id: 'laundry', label: 'Laundry', emoji: '🧺' },
]

// Each kid's individual chore.
export const CHORE_BY_KID: Record<string, Task> = {
  Emma: { id: 'roomba', label: 'Run the Roomba', emoji: '🤖' },
  Max: { id: 'mow', label: 'Mow the Grass', emoji: '🚜' },
  Zoe: { id: 'table', label: 'Clear the Table', emoji: '🍽️' },
  Owen: { id: 'weeds', label: 'Weed Eater', emoji: '🌿' },
}

export function tasksForKid(name: string): Task[] {
  const chore = CHORE_BY_KID[name]
  return chore ? [...SHARED_TASKS, chore] : [...SHARED_TASKS]
}

// "Today" in Central time, so evening check-offs land on the right day (the rest
// of the app uses UTC dates, which would roll over at ~7pm CT).
export function choreToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
}

// --- Persistence: one small blob, date -> kid -> completed task ids ---

export type ChoreLog = Record<string, Record<string, string[]>>

const KEY = 'chores:log'

export async function getChoreLog(): Promise<ChoreLog> {
  try {
    return (await redis.get<ChoreLog>(KEY)) ?? {}
  } catch {
    return {}
  }
}

// Overwrite a kid's completed base-task ids for a date (admin backfill). Invalid
// ids are dropped; an empty list clears the day. Returns the ids applied.
export async function setChoreRecord(kid: string, date: string, taskIds: string[]): Promise<string[]> {
  const valid = new Set(tasksForKid(kid).map((t) => t.id))
  const ids = [...new Set(taskIds)].filter((id) => valid.has(id))
  const log = await getChoreLog()
  const day = log[date] ?? {}
  if (ids.length) day[kid] = ids
  else delete day[kid]
  log[date] = day
  await redis.set(KEY, log)
  return ids
}

export async function setChoreDone(kid: string, taskId: string, date: string, done: boolean): Promise<void> {
  const log = await getChoreLog()
  const day = log[date] ?? {}
  const set = new Set(day[kid] ?? [])
  if (done) set.add(taskId)
  else set.delete(taskId)
  day[kid] = [...set]
  log[date] = day
  await redis.set(KEY, log)
}

// --- One-off ("extra") chores a parent adds for a given kid on a given day ---

export type ExtraLog = Record<string, Record<string, Task[]>> // date -> kid -> extra tasks
const EXTRA_KEY = 'chores:extra'

export async function getExtraChores(): Promise<ExtraLog> {
  try {
    return (await redis.get<ExtraLog>(EXTRA_KEY)) ?? {}
  } catch {
    return {}
  }
}

export async function addExtraChore(kid: string, date: string, label: string): Promise<void> {
  const clean = label.trim().slice(0, 40)
  if (!clean) return
  const extra = await getExtraChores()
  const day = extra[date] ?? {}
  const list = day[kid] ?? []
  const id = `x-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`
  list.push({ id, label: clean, emoji: '⭐' })
  day[kid] = list
  extra[date] = day
  await redis.set(EXTRA_KEY, extra)
}

export async function removeExtraChore(kid: string, date: string, id: string): Promise<void> {
  const extra = await getExtraChores()
  if (extra[date]?.[kid]) {
    extra[date][kid] = extra[date][kid].filter((t) => t.id !== id)
    await redis.set(EXTRA_KEY, extra)
  }
  // Also drop any completion of the removed task so it doesn't linger.
  const log = await getChoreLog()
  if (log[date]?.[kid]?.includes(id)) {
    log[date][kid] = log[date][kid].filter((x) => x !== id)
    await redis.set(KEY, log)
  }
}

// --- Pure helpers for the board / heatmap ---

const parse = (s: string) => new Date(s + 'T12:00:00Z')
const fmt = (d: Date) => d.toISOString().slice(0, 10)
export function addDays(s: string, n: number): string {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fmt(d)
}
const dow = (s: string) => parse(s).getUTCDay() // 0 = Sunday
const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)

export type DayCell = { date: string; count: number; future: boolean }
export type KidBoard = {
  name: string
  emoji: string
  color: string
  tasks: Task[] // today's tasks (base + any extras)
  extraIds: string[] // which of `tasks` are one-off extras (removable by a parent)
  doneIds: string[]
  total: number // today's task count (for the header)
  baseTotal: number // fixed denominator for the heatmap percentage
  weeks: DayCell[][] // columns of 7 days (Sun→Sat)
  current: number // current streak of active days
  longest: number // longest streak of active days
}

const GRID_WEEKS = 6 // recent history is what matters; keeps the grid compact

export function buildKidBoard(log: ChoreLog, extra: ExtraLog, kidName: string, today: string): KidBoard {
  const kid = KIDS.find((k) => k.name === kidName)!
  const base = tasksForKid(kidName)

  // The heatmap just counts how much got done each day (volume), shaded as a
  // percentage of the base task list. Extras add to the count (and can push a
  // day to 100%). No per-day denominator needed.
  const countOn = (date: string) => (log[date]?.[kidName] ?? []).length

  // Grid: start on the Sunday ~GRID_WEEKS back, run through today.
  let start = addDays(today, -((GRID_WEEKS - 1) * 7))
  start = addDays(start, -dow(start))
  const numWeeks = Math.floor(daysBetween(start, today) / 7) + 1
  const weeks: DayCell[][] = []
  for (let w = 0; w < numWeeks; w++) {
    const days: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      days.push({ date, count: countOn(date), future: date > today })
    }
    weeks.push(days)
  }

  // Streaks: an "active" day = at least one task done.
  const active = (date: string) => countOn(date) >= 1
  let current = 0
  let cursor = active(today) ? today : addDays(today, -1)
  while (active(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  let longest = 0
  let run = 0
  for (let x = start; x <= today; x = addDays(x, 1)) {
    if (active(x)) {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  const todaysExtras = extra[today]?.[kidName] ?? []
  const tasks = [...base, ...todaysExtras]
  const validToday = new Set(tasks.map((t) => t.id))
  const doneIds = (log[today]?.[kidName] ?? []).filter((id) => validToday.has(id))
  return {
    name: kid.name,
    emoji: kid.emoji,
    color: kid.color,
    tasks,
    extraIds: todaysExtras.map((t) => t.id),
    doneIds,
    total: tasks.length,
    baseTotal: base.length,
    weeks,
    current,
    longest,
  }
}
