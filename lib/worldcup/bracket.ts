// 2026 World Cup knockout bracket (M73–M104) — the structural single source of
// truth. Each match keeps its official FIFA number; the Round of 32 has concrete
// teams, every later match feeds off the winner/loser of earlier ones. Entering
// one result auto-advances the team into the next match via resolveBracket().
//
// Team names are the canonical ones from data.ts/flags.ts so badges resolve.

import { teamByName } from './data'
import type { GradedMatch } from './picks'

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | '3rd' | 'Final'

export const ROUND_META: Record<Round, { label: string; tag: string; color: string; order: number }> = {
  R32: { label: 'Round of 32', tag: 'R32', color: '#64748B', order: 0 },
  R16: { label: 'Round of 16', tag: 'R16', color: '#0EA5E9', order: 1 },
  QF: { label: 'Quarter-finals', tag: 'QF', color: '#14B8A6', order: 2 },
  SF: { label: 'Semi-finals', tag: 'SF', color: '#8B5CF6', order: 3 },
  '3rd': { label: 'Third-place play-off', tag: '3rd', color: '#A16207', order: 4 },
  Final: { label: 'Final', tag: 'Final', color: '#EAB308', order: 5 },
}

// A match slot is filled by a named team (R32) or the winner/loser of another match.
type Feeder = { team: string } | { win: number } | { lose: number }

export type KoMatch = {
  no: number
  round: Round
  date: string // ISO YYYY-MM-DD
  time: string
  venue: string
  home: Feeder
  away: Feeder
}

// Result of a knockout match: the 90/120-min score plus who advanced (needed
// because a level score is decided on penalties).
export type KoResult = { ga: number; gb: number; advanced: 'home' | 'away' }
export type KoResults = Record<number, KoResult>

const T = (team: string): Feeder => ({ team })
const W = (no: number): Feeder => ({ win: no })
const L = (no: number): Feeder => ({ lose: no })

export const BRACKET: KoMatch[] = [
  // Round of 32 — teams set
  { no: 73, round: 'R32', date: '2026-06-28', time: '2:00 PM CDT', venue: 'SoFi Stadium, Los Angeles', home: T('South Africa'), away: T('Canada') },
  { no: 74, round: 'R32', date: '2026-06-29', time: '3:30 PM CDT', venue: 'Gillette Stadium, Boston', home: T('Germany'), away: T('Paraguay') },
  { no: 75, round: 'R32', date: '2026-06-29', time: '8:00 PM CDT', venue: 'Estadio BBVA, Monterrey', home: T('Netherlands'), away: T('Morocco') },
  { no: 76, round: 'R32', date: '2026-06-29', time: '12:00 PM CDT', venue: 'NRG Stadium, Houston', home: T('Brazil'), away: T('Japan') },
  { no: 77, round: 'R32', date: '2026-06-30', time: '4:00 PM CDT', venue: 'MetLife Stadium, New York', home: T('France'), away: T('Sweden') },
  { no: 78, round: 'R32', date: '2026-06-30', time: '12:00 PM CDT', venue: 'AT&T Stadium, Dallas', home: T('Ivory Coast'), away: T('Norway') },
  { no: 79, round: 'R32', date: '2026-06-30', time: '8:00 PM CDT', venue: 'Estadio Azteca, Mexico City', home: T('Mexico'), away: T('Ecuador') },
  { no: 80, round: 'R32', date: '2026-07-01', time: '11:00 AM CDT', venue: 'Mercedes-Benz, Atlanta', home: T('England'), away: T('DR Congo') },
  { no: 81, round: 'R32', date: '2026-07-01', time: '7:00 PM CDT', venue: "Levi's Stadium, SF Bay", home: T('United States'), away: T('Bosnia & Herzegovina') },
  { no: 82, round: 'R32', date: '2026-07-01', time: '3:00 PM CDT', venue: 'Lumen Field, Seattle', home: T('Belgium'), away: T('Senegal') },
  { no: 83, round: 'R32', date: '2026-07-02', time: '6:00 PM CDT', venue: 'BMO Field, Toronto', home: T('Portugal'), away: T('Croatia') },
  { no: 84, round: 'R32', date: '2026-07-02', time: '2:00 PM CDT', venue: 'SoFi Stadium, Los Angeles', home: T('Spain'), away: T('Austria') },
  { no: 85, round: 'R32', date: '2026-07-02', time: '10:00 PM CDT', venue: 'BC Place, Vancouver', home: T('Switzerland'), away: T('Algeria') },
  { no: 86, round: 'R32', date: '2026-07-03', time: '5:00 PM CDT', venue: 'Hard Rock Stadium, Miami', home: T('Argentina'), away: T('Cabo Verde') },
  { no: 87, round: 'R32', date: '2026-07-03', time: '8:30 PM CDT', venue: 'Arrowhead, Kansas City', home: T('Colombia'), away: T('Ghana') },
  { no: 88, round: 'R32', date: '2026-07-03', time: '1:00 PM CDT', venue: 'AT&T Stadium, Dallas', home: T('Australia'), away: T('Egypt') },
  // Round of 16
  { no: 89, round: 'R16', date: '2026-07-04', time: '4:00 PM CDT', venue: 'Philadelphia', home: W(74), away: W(77) },
  { no: 90, round: 'R16', date: '2026-07-04', time: '12:00 PM CDT', venue: 'Houston', home: W(73), away: W(75) },
  { no: 91, round: 'R16', date: '2026-07-05', time: '3:00 PM CDT', venue: 'New York', home: W(76), away: W(78) },
  { no: 92, round: 'R16', date: '2026-07-05', time: '7:00 PM CDT', venue: 'Mexico City', home: W(79), away: W(80) },
  { no: 93, round: 'R16', date: '2026-07-06', time: '2:00 PM CDT', venue: 'Dallas', home: W(83), away: W(84) },
  { no: 94, round: 'R16', date: '2026-07-06', time: '7:00 PM CDT', venue: 'Seattle', home: W(81), away: W(82) },
  { no: 95, round: 'R16', date: '2026-07-07', time: '11:00 AM CDT', venue: 'Atlanta', home: W(86), away: W(88) },
  { no: 96, round: 'R16', date: '2026-07-07', time: '12:00 PM CDT', venue: 'Vancouver', home: W(85), away: W(87) },
  // Quarter-finals
  { no: 97, round: 'QF', date: '2026-07-09', time: '3:00 PM CDT', venue: 'Boston', home: W(89), away: W(90) },
  { no: 98, round: 'QF', date: '2026-07-10', time: '2:00 PM CDT', venue: 'Los Angeles', home: W(93), away: W(94) },
  { no: 99, round: 'QF', date: '2026-07-11', time: '4:00 PM CDT', venue: 'Miami', home: W(91), away: W(92) },
  { no: 100, round: 'QF', date: '2026-07-11', time: '8:00 PM CDT', venue: 'Kansas City', home: W(95), away: W(96) },
  // Semi-finals
  { no: 101, round: 'SF', date: '2026-07-14', time: '2:00 PM CDT', venue: 'Dallas', home: W(97), away: W(98) },
  { no: 102, round: 'SF', date: '2026-07-15', time: '2:00 PM CDT', venue: 'Atlanta', home: W(99), away: W(100) },
  // Third place & Final
  { no: 103, round: '3rd', date: '2026-07-18', time: '4:00 PM CDT', venue: 'Miami', home: L(101), away: L(102) },
  { no: 104, round: 'Final', date: '2026-07-19', time: '2:00 PM CDT', venue: 'New York / NJ', home: W(101), away: W(102) },
]

export const koMatchId = (no: number): string => `KO|${no}`

export type ResolvedMatch = {
  no: number
  round: Round
  date: string
  time: string
  venue: string
  home: string | null // resolved team name, or null if its feeder isn't decided
  away: string | null
  homeLabel: string // e.g. "Winner M74" when unresolved
  awayLabel: string
  homeFlag: string | null // emoji fallback
  awayFlag: string | null
  ga: number | null
  gb: number | null
  advanced: 'home' | 'away' | null
  winner: string | null
  loser: string | null
  played: boolean
}

function feederLabel(f: Feeder): string {
  if ('team' in f) return f.team
  if ('win' in f) return `Winner M${f.win}`
  return `Loser M${f.lose}`
}

// Resolve every match's teams by following winners/losers through the bracket.
export function resolveBracket(results: KoResults): ResolvedMatch[] {
  const byNo = new Map(BRACKET.map((m) => [m.no, m]))
  const teamCache = new Map<number, { home: string | null; away: string | null }>()
  const winCache = new Map<number, string | null>()

  const resolveFeeder = (f: Feeder): string | null => {
    if ('team' in f) return f.team
    if ('win' in f) return winnerOf(f.win)
    return loserOf(f.lose)
  }
  const teamsOf = (no: number): { home: string | null; away: string | null } => {
    const cached = teamCache.get(no)
    if (cached) return cached
    const m = byNo.get(no)
    const t = m ? { home: resolveFeeder(m.home), away: resolveFeeder(m.away) } : { home: null, away: null }
    teamCache.set(no, t)
    return t
  }
  const winnerOf = (no: number): string | null => {
    if (winCache.has(no)) return winCache.get(no)!
    const r = results[no]
    const { home, away } = teamsOf(no)
    const w = r && home && away ? (r.advanced === 'home' ? home : away) : null
    winCache.set(no, w)
    return w
  }
  const loserOf = (no: number): string | null => {
    const r = results[no]
    const { home, away } = teamsOf(no)
    return r && home && away ? (r.advanced === 'home' ? away : home) : null
  }

  return BRACKET.map((m) => {
    const { home, away } = teamsOf(m.no)
    const r = results[m.no] ?? null
    return {
      no: m.no,
      round: m.round,
      date: m.date,
      time: m.time,
      venue: m.venue,
      home,
      away,
      homeLabel: feederLabel(m.home),
      awayLabel: feederLabel(m.away),
      homeFlag: home ? teamByName(home)?.flag ?? null : null,
      awayFlag: away ? teamByName(away)?.flag ?? null : null,
      ga: r?.ga ?? null,
      gb: r?.gb ?? null,
      advanced: r?.advanced ?? null,
      winner: winnerOf(m.no),
      loser: loserOf(m.no),
      played: !!r,
    }
  })
}

// Played knockout matches as GradedMatch entries for the combined leaderboard.
export function koGraded(results: KoResults): GradedMatch[] {
  return Object.entries(results).map(([no, r]) => ({
    matchId: koMatchId(Number(no)),
    actual: { ga: r.ga, gb: r.gb },
    ko: { advanced: r.advanced },
  }))
}
