// Group-stage prediction engine for the 2026 World Cup.
//
// Everything here is pure and deterministic: same data in, same table out.
// Played matches are taken as-is; unplayed matches are predicted from team
// power ratings, then every match (real + predicted) is fed into the standard
// 3pts-a-win table. The 48-team format sends the top 2 of each group plus the
// 8 best third-placed teams to the round of 32.

import { GROUPS } from './data'
import type { Group, Team } from './data'

export type Match = {
  group: string
  home: Team
  away: Team
  ga: number
  gb: number
  played: boolean // true = real result, false = model prediction
}

export type Standing = {
  team: Team
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  rank: number // 1-based position within the group
}

// Predicted goals for a side, given the two power ratings. Evenly matched
// teams sit at ~1.35 expected goals (so the model leans to a 1–1 draw); each
// rating point of advantage nudges that up, the deficit nudges it down.
function expectedGoals(self: number, opponent: number): number {
  const BASE = 1.35
  return BASE * Math.exp((self - opponent) / 45)
}

export type Prediction = {
  ga: number
  gb: number
  confidence: 'Toss-up' | 'Lean' | 'Favored' | 'Strong'
  favorite: Team | null // null when predicted draw
}

export function predictMatch(home: Team, away: Team): Prediction {
  let ga = Math.round(expectedGoals(home.rating, away.rating))
  let gb = Math.round(expectedGoals(away.rating, home.rating))

  // A clearly stronger team shouldn't be predicted to draw or lose just
  // because rounding collapsed a half-goal edge.
  const diff = home.rating - away.rating
  if (diff > 5 && ga <= gb) ga = gb + 1
  if (diff < -5 && gb <= ga) gb = ga + 1

  const gap = Math.abs(diff)
  const confidence: Prediction['confidence'] =
    gap < 5 ? 'Toss-up' : gap < 15 ? 'Lean' : gap < 30 ? 'Favored' : 'Strong'

  let favorite: Team | null = null
  if (ga > gb) favorite = home
  else if (gb > ga) favorite = away

  return { ga, gb, confidence, favorite }
}

// The six round-robin pairings of a four-team group, in a stable order.
function pairings(teams: Team[]): [Team, Team][] {
  const out: [Team, Team][] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      out.push([teams[i], teams[j]])
    }
  }
  return out
}

function rawResult(group: Group, a: string, b: string) {
  for (const r of group.results) {
    if ((r.a === a && r.b === b) || (r.a === b && r.b === a)) return r
  }
  return null
}

// All six matches of a group as either real results or predictions. Played
// matches keep the real home/away orientation stored in data.ts (home = the
// team listed first); unplayed matches fall back to the group's listing order.
export function groupMatches(group: Group): Match[] {
  const byName = new Map(group.teams.map((t) => [t.name, t]))
  return pairings(group.teams).map(([home, away]) => {
    const r = rawResult(group, home.name, away.name)
    if (r) {
      return {
        group: group.id,
        home: byName.get(r.a)!,
        away: byName.get(r.b)!,
        ga: r.ga,
        gb: r.gb,
        played: true,
      }
    }
    const p = predictMatch(home, away)
    return { group: group.id, home, away, ga: p.ga, gb: p.gb, played: false }
  })
}

function blankStanding(team: Team, group: string): Standing {
  return {
    team,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    rank: 0,
  }
}

function applyMatch(table: Map<string, Standing>, m: Match) {
  const home = table.get(m.home.name)!
  const away = table.get(m.away.name)!
  home.played++
  away.played++
  home.gf += m.ga
  home.ga += m.gb
  away.gf += m.gb
  away.ga += m.ga
  if (m.ga > m.gb) {
    home.won++
    away.lost++
    home.points += 3
  } else if (m.ga < m.gb) {
    away.won++
    home.lost++
    away.points += 3
  } else {
    home.drawn++
    away.drawn++
    home.points += 1
    away.points += 1
  }
}

// Standard FIFA ordering: points, then goal difference, then goals for. We
// fall back to the power rating (and name) as a deterministic stand-in for the
// finer tiebreakers (head-to-head, fair play, drawing of lots).
function compareStandings(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  if (b.team.rating !== a.team.rating) return b.team.rating - a.team.rating
  return a.team.name.localeCompare(b.team.name)
}

export type GroupProjection = {
  id: string
  matches: Match[]
  table: Standing[]
}

function buildStandings(group: Group, matches: Match[]): Standing[] {
  const table = new Map<string, Standing>()
  for (const team of group.teams) table.set(team.name, blankStanding(team, group.id))
  for (const m of matches) applyMatch(table, m)
  for (const s of table.values()) s.gd = s.gf - s.ga

  const ordered = [...table.values()].sort(compareStandings)
  ordered.forEach((s, i) => (s.rank = i + 1))
  return ordered
}

export function projectGroup(group: Group): GroupProjection {
  const matches = groupMatches(group)
  return { id: group.id, matches, table: buildStandings(group, matches) }
}

// Standings from games actually played so far (no predictions).
export function actualGroupTable(group: Group): Standing[] {
  return buildStandings(group, groupMatches(group).filter((m) => m.played))
}

export type Tournament = {
  groups: GroupProjection[]
  // The 12 third-placed teams ranked head-to-head; the top 8 advance.
  thirdsRace: Standing[]
  // Names of the 8 third-placed teams projected to advance.
  qualifyingThirds: Set<string>
}

export function projectTournament(groups: Group[] = GROUPS): Tournament {
  const projections = groups.map(projectGroup)

  const thirdsRace = projections
    .map((g) => g.table[2])
    .filter(Boolean)
    .sort(compareStandings)

  const qualifyingThirds = new Set(thirdsRace.slice(0, 8).map((s) => s.team.name))

  return { groups: projections, thirdsRace, qualifyingThirds }
}

// --- Qualification outlook -------------------------------------------------

export type Bucket = 'through' | 'likely-through' | 'likely-out' | 'out'

// Points each team has actually banked so far.
function actualPoints(group: Group): Map<string, number> {
  const pts = new Map<string, number>(group.teams.map((t) => [t.name, 0]))
  for (const m of groupMatches(group).filter((m) => m.played)) {
    if (m.ga > m.gb) pts.set(m.home.name, pts.get(m.home.name)! + 3)
    else if (m.ga < m.gb) pts.set(m.away.name, pts.get(m.away.name)! + 3)
    else {
      pts.set(m.home.name, pts.get(m.home.name)! + 1)
      pts.set(m.away.name, pts.get(m.away.name)! + 1)
    }
  }
  return pts
}

function lossesByTeam(group: Group): Map<string, number> {
  const losses = new Map<string, number>(group.teams.map((t) => [t.name, 0]))
  for (const m of groupMatches(group).filter((m) => m.played)) {
    if (m.ga > m.gb) losses.set(m.away.name, losses.get(m.away.name)! + 1)
    else if (m.ga < m.gb) losses.set(m.home.name, losses.get(m.home.name)! + 1)
  }
  return losses
}

// Teams mathematically guaranteed a top-2 finish: across EVERY outcome of the
// group's remaining games, at most one other team can finish level-or-above on
// points (so no tiebreaker can drop them to 3rd). Brute-forced — a group has at
// most 4 games left (3^4 = 81 combinations).
export function confirmedThrough(group: Group): Set<string> {
  const remaining = groupMatches(group).filter((m) => !m.played)
  const base = actualPoints(group)
  const safe = new Map<string, boolean>(group.teams.map((t) => [t.name, true]))

  const combos = 3 ** remaining.length
  for (let c = 0; c < combos; c++) {
    const pts = new Map(base)
    let x = c
    for (const m of remaining) {
      const o = x % 3
      x = Math.floor(x / 3)
      if (o === 0) pts.set(m.home.name, pts.get(m.home.name)! + 3)
      else if (o === 1) pts.set(m.away.name, pts.get(m.away.name)! + 3)
      else {
        pts.set(m.home.name, pts.get(m.home.name)! + 1)
        pts.set(m.away.name, pts.get(m.away.name)! + 1)
      }
    }
    for (const t of group.teams) {
      if (!safe.get(t.name)) continue
      const tp = pts.get(t.name)!
      let atOrAbove = 0
      for (const u of group.teams) {
        if (u.name !== t.name && pts.get(u.name)! >= tp) atOrAbove++
      }
      if (atOrAbove > 1) safe.set(t.name, false)
    }
  }
  return new Set([...safe].filter(([, v]) => v).map(([k]) => k))
}

export type GroupAnalysis = {
  id: string
  table: Standing[] // actual standings so far
  buckets: Map<string, Bucket>
}

// Confirmed status comes from real results only; "likely" leans on the model's
// projection of the remaining games (top 2, plus the 8 best third-placed).
export function analyzeTournament(groups: Group[] = GROUPS): { groups: GroupAnalysis[] } {
  const proj = projectTournament(groups)
  const projRank = new Map<string, number>()
  for (const g of proj.groups) for (const s of g.table) projRank.set(s.team.name, s.rank)

  const analyses = groups.map((group): GroupAnalysis => {
    const table = actualGroupTable(group)
    const through = confirmedThrough(group)
    const losses = lossesByTeam(group)
    const buckets = new Map<string, Bucket>()

    for (const s of table) {
      const name = s.team.name
      if ((losses.get(name) ?? 0) >= 2) buckets.set(name, 'out')
      else if (through.has(name)) buckets.set(name, 'through')
      else {
        const r = projRank.get(name) ?? 4
        const advancing = r <= 2 || (r === 3 && proj.qualifyingThirds.has(name))
        buckets.set(name, advancing ? 'likely-through' : 'likely-out')
      }
    }
    return { id: group.id, table, buckets }
  })

  return { groups: analyses }
}
