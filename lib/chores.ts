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
  tasks: Task[]
  doneIds: string[]
  total: number
  weeks: DayCell[][] // columns of 7 days (Sun→Sat)
  current: number // current streak of active days
  longest: number // longest streak of active days
}

const GRID_WEEKS = 6 // recent history is what matters; keeps the grid compact

export function buildKidBoard(log: ChoreLog, kidName: string, today: string): KidBoard {
  const kid = KIDS.find((k) => k.name === kidName)!
  const tasks = tasksForKid(kidName)
  const total = tasks.length
  const valid = new Set(tasks.map((t) => t.id))
  const count = (date: string) => (log[date]?.[kidName] ?? []).filter((id) => valid.has(id)).length

  // Grid: start on the Sunday ~13 weeks back, run through today.
  let start = addDays(today, -((GRID_WEEKS - 1) * 7))
  start = addDays(start, -dow(start))
  const numWeeks = Math.floor(daysBetween(start, today) / 7) + 1
  const weeks: DayCell[][] = []
  for (let w = 0; w < numWeeks; w++) {
    const days: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      days.push({ date, count: count(date), future: date > today })
    }
    weeks.push(days)
  }

  // Streaks: an "active" day = at least one task done.
  const active = (date: string) => count(date) >= 1
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

  const doneIds = (log[today]?.[kidName] ?? []).filter((id) => valid.has(id))
  return { name: kid.name, emoji: kid.emoji, color: kid.color, tasks, doneIds, total, weeks, current, longest }
}
