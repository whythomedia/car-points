import { FLAG_CODES } from '@/lib/worldcup/flags'

// Accepted alternate spellings/short names per country (besides the name
// itself). Matching is accent- and punctuation-insensitive, so "cote divoire"
// and "Côte d'Ivoire" both work.
const ALIASES: Record<string, string[]> = {
  'United States': ['usa', 'us', 'america', 'united states of america'],
  Türkiye: ['turkey'],
  'Cabo Verde': ['cape verde'],
  'Bosnia & Herzegovina': ['bosnia', 'bosnia and herzegovina', 'bosnia herzegovina'],
  'Ivory Coast': ['cote divoire', 'cote d ivoire', 'cotedivoire'],
  Czechia: ['czech republic', 'czech'],
  'DR Congo': ['congo', 'democratic republic of congo', 'drc', 'dr congo'],
  'South Korea': ['korea', 'korea republic', 'republic of korea'],
  'Saudi Arabia': ['saudi'],
  Netherlands: ['holland'],
  Brazil: ['brasil'],
}

export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type FlagQuestion = {
  code: string
  name: string
  accept: string[] // normalized
}

export const FLAG_QUESTIONS: FlagQuestion[] = Object.entries(FLAG_CODES).map(
  ([name, code]) => ({
    code,
    name,
    accept: [name, ...(ALIASES[name] ?? [])].map(norm),
  })
)

export function isCorrect(guess: string, q: FlagQuestion): boolean {
  return q.accept.includes(norm(guess))
}
