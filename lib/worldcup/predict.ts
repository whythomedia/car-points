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

function findResult(group: Group, a: string, b: string) {
  for (const r of group.results) {
    if (r.a === a && r.b === b) return { ga: r.ga, gb: r.gb, flip: false }
    if (r.a === b && r.b === a) return { ga: r.gb, gb: r.ga, flip: false }
  }
  return null
}

// All six matches of a group as either real results or predictions.
export function groupMatches(group: Group): Match[] {
  return pairings(group.teams).map(([home, away]) => {
    const real = findResult(group, home.name, away.name)
    if (real) {
      return { group: group.id, home, away, ga: real.ga, gb: real.gb, played: true }
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

export function projectGroup(group: Group): GroupProjection {
  const matches = groupMatches(group)
  const table = new Map<string, Standing>()
  for (const team of group.teams) table.set(team.name, blankStanding(team, group.id))
  for (const m of matches) applyMatch(table, m)
  for (const s of table.values()) s.gd = s.gf - s.ga

  const ordered = [...table.values()].sort(compareStandings)
  ordered.forEach((s, i) => (s.rank = i + 1))
  return { id: group.id, matches, table: ordered }
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

export type Advancement = 'auto' | 'third-in' | 'third-out' | 'eliminated'

export function advancement(
  standing: Standing,
  qualifyingThirds: Set<string>
): Advancement {
  if (standing.rank <= 2) return 'auto'
  if (standing.rank === 3) {
    return qualifyingThirds.has(standing.team.name) ? 'third-in' : 'third-out'
  }
  return 'eliminated'
}
