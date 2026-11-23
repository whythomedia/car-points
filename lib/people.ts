// Canonical family roster — one source of truth for "who." Names are stable and
// match the keys used across the app (points, chores), so no
// stored data migrates. This module is client-safe (no server-only imports); the
// cookie helpers live in current-user.ts.

export type Role = 'kid' | 'parent'

export type Person = {
  name: string
  emoji: string
  color: string
  role: Role
  reader: boolean // has the reading game
}

export const PEOPLE: Person[] = [
  { name: 'Owen', emoji: '🐧', color: '#0EA5E9', role: 'kid', reader: false },
  { name: 'Zoe', emoji: '🦓', color: '#8B5CF6', role: 'kid', reader: true },
  { name: 'Max', emoji: '🐆', color: '#F59E0B', role: 'kid', reader: false },
  { name: 'Emma', emoji: '🐼', color: '#EC4899', role: 'kid', reader: false },
  { name: 'Mom', emoji: '👩', color: '#BA69C7', role: 'parent', reader: false },
  { name: 'Dad', emoji: '👨', color: '#16A34A', role: 'parent', reader: false },
]

export const KID_PEOPLE = PEOPLE.filter((p) => p.role === 'kid')

export function personByName(name: string | null | undefined): Person | null {
  if (!name) return null
  return PEOPLE.find((p) => p.name === name) ?? null
}

export const USER_COOKIE = 'cp-user'
