// The 2026 World Cup group-stage schedule — single source of truth for
// fixtures: match number, date, kickoff, venue, the real home/away (home is
// the team listed first), and the final score once played (null until then).
// Generated from the official schedule.

export type Fixture = {
  no: number
  group: string
  date: string // ISO YYYY-MM-DD
  time: string
  venue: string
  home: string
  away: string
  ga: number | null // home goals, once played
  gb: number | null
}

export const FIXTURES: Fixture[] = [
  { no: 1, group: "A", date: "2026-06-11", time: "2:00 PM CDT", venue: "Estadio Azteca, Mexico City", home: "Mexico", away: "South Africa", ga: 2, gb: 0 },
  { no: 2, group: "A", date: "2026-06-11", time: "9:00 PM CDT", venue: "Estadio Akron, Zapopan", home: "South Korea", away: "Czechia", ga: 2, gb: 1 },
  { no: 3, group: "B", date: "2026-06-12", time: "2:00 PM CDT", venue: "BMO Field, Toronto", home: "Canada", away: "Bosnia & Herzegovina", ga: 1, gb: 1 },
  { no: 4, group: "D", date: "2026-06-12", time: "8:00 PM CDT", venue: "SoFi Stadium, Los Angeles", home: "United States", away: "Paraguay", ga: 4, gb: 1 },
  { no: 5, group: "C", date: "2026-06-13", time: "8:00 PM CDT", venue: "Gillette Stadium, Boston", home: "Haiti", away: "Scotland", ga: 0, gb: 1 },
  { no: 6, group: "D", date: "2026-06-13", time: "11:00 PM CDT", venue: "BC Place, Vancouver", home: "Australia", away: "Türkiye", ga: 2, gb: 0 },
  { no: 7, group: "C", date: "2026-06-13", time: "5:00 PM CDT", venue: "MetLife Stadium, New York", home: "Brazil", away: "Morocco", ga: 1, gb: 1 },
  { no: 8, group: "B", date: "2026-06-13", time: "2:00 PM CDT", venue: "Levi's Stadium, Santa Clara", home: "Qatar", away: "Switzerland", ga: 1, gb: 1 },
  { no: 9, group: "E", date: "2026-06-14", time: "6:00 PM CDT", venue: "Lincoln Financial, Philadelphia", home: "Ivory Coast", away: "Ecuador", ga: 1, gb: 0 },
  { no: 10, group: "E", date: "2026-06-14", time: "12:00 PM CDT", venue: "NRG Stadium, Houston", home: "Germany", away: "Curaçao", ga: 7, gb: 1 },
  { no: 11, group: "F", date: "2026-06-14", time: "3:00 PM CDT", venue: "AT&T Stadium, Dallas", home: "Netherlands", away: "Japan", ga: 2, gb: 2 },
  { no: 12, group: "F", date: "2026-06-14", time: "9:00 PM CDT", venue: "Estadio Akron, Guadalajara", home: "Sweden", away: "Tunisia", ga: 5, gb: 1 },
  { no: 13, group: "H", date: "2026-06-15", time: "5:00 PM CDT", venue: "Hard Rock Stadium, Miami", home: "Saudi Arabia", away: "Uruguay", ga: 1, gb: 1 },
  { no: 14, group: "H", date: "2026-06-15", time: "11:00 AM CDT", venue: "Mercedes-Benz, Atlanta", home: "Spain", away: "Cabo Verde", ga: 0, gb: 0 },
  { no: 15, group: "G", date: "2026-06-15", time: "8:00 PM CDT", venue: "SoFi Stadium, Los Angeles", home: "Iran", away: "New Zealand", ga: 2, gb: 2 },
  { no: 16, group: "G", date: "2026-06-15", time: "2:00 PM CDT", venue: "Lumen Field, Seattle", home: "Belgium", away: "Egypt", ga: 1, gb: 1 },
  { no: 17, group: "I", date: "2026-06-16", time: "2:00 PM CDT", venue: "MetLife Stadium, New York", home: "France", away: "Senegal", ga: 3, gb: 1 },
  { no: 18, group: "I", date: "2026-06-16", time: "5:00 PM CDT", venue: "Gillette Stadium, Boston", home: "Iraq", away: "Norway", ga: 1, gb: 4 },
  { no: 19, group: "J", date: "2026-06-16", time: "8:00 PM CDT", venue: "Arrowhead, Kansas City", home: "Argentina", away: "Algeria", ga: 3, gb: 0 },
  { no: 20, group: "J", date: "2026-06-16", time: "11:00 PM CDT", venue: "Levi's Stadium, Santa Clara", home: "Austria", away: "Jordan", ga: 3, gb: 1 },
  { no: 21, group: "L", date: "2026-06-17", time: "6:00 PM CDT", venue: "BMO Field, Toronto", home: "Ghana", away: "Panama", ga: 1, gb: 0 },
  { no: 22, group: "L", date: "2026-06-17", time: "3:00 PM CDT", venue: "AT&T Stadium, Dallas", home: "England", away: "Croatia", ga: 4, gb: 2 },
  { no: 23, group: "K", date: "2026-06-17", time: "12:00 PM CDT", venue: "NRG Stadium, Houston", home: "Portugal", away: "DR Congo", ga: 1, gb: 1 },
  { no: 24, group: "K", date: "2026-06-17", time: "9:00 PM CDT", venue: "Estadio Azteca, Mexico City", home: "Uzbekistan", away: "Colombia", ga: 1, gb: 3 },
  { no: 25, group: "A", date: "2026-06-18", time: "11:00 AM CDT", venue: "Mercedes-Benz, Atlanta", home: "Czechia", away: "South Africa", ga: 1, gb: 1 },
  { no: 26, group: "B", date: "2026-06-18", time: "2:00 PM CDT", venue: "SoFi Stadium, Los Angeles", home: "Switzerland", away: "Bosnia & Herzegovina", ga: 4, gb: 1 },
  { no: 27, group: "B", date: "2026-06-18", time: "5:00 PM CDT", venue: "BC Place, Vancouver", home: "Canada", away: "Qatar", ga: 6, gb: 0 },
  { no: 28, group: "A", date: "2026-06-18", time: "8:00 PM CDT", venue: "Estadio Akron, Zapopan", home: "Mexico", away: "South Korea", ga: 1, gb: 0 },
  { no: 29, group: "C", date: "2026-06-19", time: "7:30 PM CDT", venue: "Lincoln Financial, Philadelphia", home: "Brazil", away: "Haiti", ga: 3, gb: 0 },
  { no: 30, group: "C", date: "2026-06-19", time: "5:00 PM CDT", venue: "Gillette Stadium, Boston", home: "Scotland", away: "Morocco", ga: 0, gb: 1 },
  { no: 31, group: "D", date: "2026-06-19", time: "10:00 PM CDT", venue: "Levi's Stadium, Santa Clara", home: "Türkiye", away: "Paraguay", ga: 0, gb: 1 },
  { no: 32, group: "D", date: "2026-06-19", time: "2:00 PM CDT", venue: "Lumen Field, Seattle", home: "United States", away: "Australia", ga: 2, gb: 0 },
  { no: 33, group: "E", date: "2026-06-20", time: "3:00 PM CDT", venue: "BMO Field, Toronto", home: "Germany", away: "Ivory Coast", ga: 2, gb: 1 },
  { no: 34, group: "E", date: "2026-06-20", time: "7:00 PM CDT", venue: "Arrowhead, Kansas City", home: "Ecuador", away: "Curaçao", ga: 0, gb: 0 },
  { no: 35, group: "F", date: "2026-06-20", time: "12:00 PM CDT", venue: "NRG Stadium, Houston", home: "Netherlands", away: "Sweden", ga: 5, gb: 1 },
  { no: 36, group: "F", date: "2026-06-20", time: "11:00 PM CDT", venue: "Estadio Akron, Guadalajara", home: "Tunisia", away: "Japan", ga: 0, gb: 4 },
  { no: 37, group: "H", date: "2026-06-21", time: "5:00 PM CDT", venue: "Hard Rock Stadium, Miami", home: "Uruguay", away: "Cabo Verde", ga: 2, gb: 2 },
  { no: 38, group: "H", date: "2026-06-21", time: "11:00 AM CDT", venue: "Mercedes-Benz, Atlanta", home: "Spain", away: "Saudi Arabia", ga: 4, gb: 0 },
  { no: 39, group: "G", date: "2026-06-21", time: "2:00 PM CDT", venue: "SoFi Stadium, Los Angeles", home: "Belgium", away: "Iran", ga: 0, gb: 0 },
  { no: 40, group: "G", date: "2026-06-21", time: "8:00 PM CDT", venue: "BC Place, Vancouver", home: "New Zealand", away: "Egypt", ga: 1, gb: 3 },
  { no: 41, group: "I", date: "2026-06-22", time: "7:00 PM CDT", venue: "MetLife Stadium, New York", home: "Norway", away: "Senegal", ga: null, gb: null },
  { no: 42, group: "I", date: "2026-06-22", time: "4:00 PM CDT", venue: "Lincoln Financial, Philadelphia", home: "France", away: "Iraq", ga: null, gb: null },
  { no: 43, group: "J", date: "2026-06-22", time: "12:00 PM CDT", venue: "AT&T Stadium, Dallas", home: "Argentina", away: "Austria", ga: null, gb: null },
  { no: 44, group: "J", date: "2026-06-22", time: "10:00 PM CDT", venue: "Levi's Stadium, Santa Clara", home: "Jordan", away: "Algeria", ga: null, gb: null },
  { no: 45, group: "L", date: "2026-06-23", time: "3:00 PM CDT", venue: "Gillette Stadium, Boston", home: "England", away: "Ghana", ga: null, gb: null },
  { no: 46, group: "L", date: "2026-06-23", time: "6:00 PM CDT", venue: "BMO Field, Toronto", home: "Panama", away: "Croatia", ga: null, gb: null },
  { no: 47, group: "K", date: "2026-06-23", time: "12:00 PM CDT", venue: "NRG Stadium, Houston", home: "Portugal", away: "Uzbekistan", ga: null, gb: null },
  { no: 48, group: "K", date: "2026-06-23", time: "9:00 PM CDT", venue: "Estadio Akron, Guadalajara", home: "Colombia", away: "DR Congo", ga: null, gb: null },
  { no: 49, group: "C", date: "2026-06-24", time: "5:00 PM CDT", venue: "Hard Rock Stadium, Miami", home: "Scotland", away: "Brazil", ga: null, gb: null },
  { no: 50, group: "C", date: "2026-06-24", time: "5:00 PM CDT", venue: "Mercedes-Benz, Atlanta", home: "Morocco", away: "Haiti", ga: null, gb: null },
  { no: 51, group: "B", date: "2026-06-24", time: "2:00 PM CDT", venue: "BC Place, Vancouver", home: "Switzerland", away: "Canada", ga: null, gb: null },
  { no: 52, group: "B", date: "2026-06-24", time: "2:00 PM CDT", venue: "Lumen Field, Seattle", home: "Bosnia & Herzegovina", away: "Qatar", ga: null, gb: null },
  { no: 53, group: "A", date: "2026-06-24", time: "8:00 PM CDT", venue: "Estadio Azteca, Mexico City", home: "Czechia", away: "Mexico", ga: null, gb: null },
  { no: 54, group: "A", date: "2026-06-24", time: "8:00 PM CDT", venue: "Estadio BBVA, Monterrey", home: "South Africa", away: "South Korea", ga: null, gb: null },
  { no: 55, group: "E", date: "2026-06-25", time: "3:00 PM CDT", venue: "Lincoln Financial, Philadelphia", home: "Curaçao", away: "Ivory Coast", ga: null, gb: null },
  { no: 56, group: "E", date: "2026-06-25", time: "3:00 PM CDT", venue: "MetLife Stadium, New York", home: "Ecuador", away: "Germany", ga: null, gb: null },
  { no: 57, group: "F", date: "2026-06-25", time: "6:00 PM CDT", venue: "AT&T Stadium, Dallas", home: "Japan", away: "Sweden", ga: null, gb: null },
  { no: 58, group: "F", date: "2026-06-25", time: "6:00 PM CDT", venue: "Arrowhead, Kansas City", home: "Tunisia", away: "Netherlands", ga: null, gb: null },
  { no: 59, group: "D", date: "2026-06-25", time: "9:00 PM CDT", venue: "SoFi Stadium, Los Angeles", home: "Türkiye", away: "United States", ga: null, gb: null },
  { no: 60, group: "D", date: "2026-06-25", time: "9:00 PM CDT", venue: "Levi's Stadium, Santa Clara", home: "Paraguay", away: "Australia", ga: null, gb: null },
  { no: 61, group: "I", date: "2026-06-26", time: "2:00 PM CDT", venue: "Gillette Stadium, Boston", home: "Norway", away: "France", ga: null, gb: null },
  { no: 62, group: "I", date: "2026-06-26", time: "2:00 PM CDT", venue: "BMO Field, Toronto", home: "Senegal", away: "Iraq", ga: null, gb: null },
  { no: 63, group: "G", date: "2026-06-26", time: "10:00 PM CDT", venue: "Lumen Field, Seattle", home: "Egypt", away: "Iran", ga: null, gb: null },
  { no: 64, group: "G", date: "2026-06-26", time: "10:00 PM CDT", venue: "BC Place, Vancouver", home: "New Zealand", away: "Belgium", ga: null, gb: null },
  { no: 65, group: "H", date: "2026-06-26", time: "7:00 PM CDT", venue: "NRG Stadium, Houston", home: "Cabo Verde", away: "Saudi Arabia", ga: null, gb: null },
  { no: 66, group: "H", date: "2026-06-26", time: "7:00 PM CDT", venue: "Estadio Akron, Guadalajara", home: "Uruguay", away: "Spain", ga: null, gb: null },
  { no: 67, group: "L", date: "2026-06-27", time: "4:00 PM CDT", venue: "MetLife Stadium, New York", home: "Panama", away: "England", ga: null, gb: null },
  { no: 68, group: "L", date: "2026-06-27", time: "4:00 PM CDT", venue: "Lincoln Financial, Philadelphia", home: "Croatia", away: "Ghana", ga: null, gb: null },
  { no: 69, group: "J", date: "2026-06-27", time: "9:00 PM CDT", venue: "Arrowhead, Kansas City", home: "Algeria", away: "Austria", ga: null, gb: null },
  { no: 70, group: "J", date: "2026-06-27", time: "9:00 PM CDT", venue: "AT&T Stadium, Dallas", home: "Jordan", away: "Argentina", ga: null, gb: null },
  { no: 71, group: "K", date: "2026-06-27", time: "6:30 PM CDT", venue: "Hard Rock Stadium, Miami", home: "Colombia", away: "Portugal", ga: null, gb: null },
  { no: 72, group: "K", date: "2026-06-27", time: "6:30 PM CDT", venue: "Mercedes-Benz, Atlanta", home: "DR Congo", away: "Uzbekistan", ga: null, gb: null },
]

import { GROUPS } from './data'

// Canonical id for a pairing: group + the two teams ordered by their group
// listing, so a match maps to one id no matter which side is passed first.
// Stable across home/away changes — picks and results stay keyed correctly.
export function matchId(groupId: string, a: string, b: string): string {
  const group = GROUPS.find((g) => g.id === groupId)
  const order = group ? group.teams.map((t) => t.name) : [a, b]
  const [first, second] = [a, b].sort((x, y) => order.indexOf(x) - order.indexOf(y))
  return `${groupId}|${first}|${second}`
}

export const FIXTURE_BY_ID = new Map(
  FIXTURES.map((f) => [matchId(f.group, f.home, f.away), f])
)

export function fixturesForGroup(groupId: string): Fixture[] {
  return FIXTURES.filter((f) => f.group === groupId).sort((a, b) => a.no - b.no)
}
