// Canonical family roster — one source of truth for "who." Names are stable and
// match the keys used across the app (points, chores, World Cup picks), so no
// stored data migrates. This module is client-safe (no server-only imports); the
// cookie helpers live in current-user.ts.

export type Role = 'kid' | 'parent'

export type Person = {
  name: string
  emoji: string
  color: string
  role: Role
  predictor: boolean // in the World Cup pick pool
  reader: boolean // has the reading game
}

export const PEOPLE: Person[] = [
  { name: 'Owen', emoji: '🐧', color: '#0EA5E9', role: 'kid', predictor: true, reader: false },
  { name: 'Zoe', emoji: '🦓', color: '#8B5CF6', role: 'kid', predictor: false, reader: true },
  { name: 'Max', emoji: '🐆', color: '#F59E0B', role: 'kid', predictor: true, reader: false },
  { name: 'Emma', emoji: '🐼', color: '#EC4899', role: 'kid', predictor: false, reader: false },
  { name: 'Mom', emoji: '👩', color: '#BA69C7', role: 'parent', predictor: true, reader: false },
  { name: 'Dad', emoji: '👨', color: '#16A34A', role: 'parent', predictor: true, reader: false },
]

export const KID_PEOPLE = PEOPLE.filter((p) => p.role === 'kid')

export function personByName(name: string | null | undefined): Person | null {
  if (!name) return null
  return PEOPLE.find((p) => p.name === name) ?? null
}

export const USER_COOKIE = 'cp-user'
