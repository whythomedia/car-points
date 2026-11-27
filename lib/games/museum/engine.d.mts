// Types for engine.mjs. The engine is plain JavaScript so its scripted
// playthroughs can run on Node with no build step.

export type MuseumLogEntry = {
  n: number
  turn: number
  cost: number
  at: string
  pick: string
  to: string
  said: string[]
  carry: string[]
  guard: string
}

// The whole saved game. Only the fields the page reads are spelled out; the
// rest belongs to the engine.
export type MuseumState = {
  v: number
  id: string
  started: string
  turns: number
  placed: string[] // treasures in the lobby case, in the order they were placed
  log: MuseumLogEntry[]
  [key: string]: unknown
}

export type MuseumView = {
  heading: string
  msg: string[]
  text: string[]
  options: string[]
  input: { label: string; min: number; max: number } | null
  carrying: string
  done: boolean
  turns: number
}

export function newState(opts?: { times?: number[]; id?: string; rng?: () => number }): MuseumState
export function view(s: MuseumState): MuseumView
export function choose(s: MuseumState, index: number): MuseumState
export function submit(s: MuseumState, value: string | number): MuseumState
export function answer(s: MuseumState): number
export function logText(s: MuseumState): string
export function normalize(s: MuseumState): MuseumState
export const ITEM_NAMES: Record<string, string>
export const HUNGER_X: number
export const LURE_TIME: Record<string, number>
