// 2026 FIFA World Cup — group-stage data.
//
// Ratings are a simple 0–100 power estimate used only to PREDICT unplayed
// matches; they have no effect on results already entered. Tweak them freely.
//
// `results` holds matches that have actually been played (scores as of the
// last update). Any of the six pairings in a group that is NOT listed here is
// treated as "not yet played" and gets predicted by the engine.
//
// Last updated from real results: 2026-06-20.

export type Team = {
  name: string
  flag: string
  rating: number
}

export type PlayedResult = {
  a: string // team name
  b: string // team name
  ga: number
  gb: number
}

export type Group = {
  id: string
  teams: Team[]
  results: PlayedResult[]
}

export const GROUPS: Group[] = [
  {
    id: 'A',
    teams: [
      { name: 'Mexico', flag: '🇲🇽', rating: 75 },
      { name: 'South Korea', flag: '🇰🇷', rating: 70 },
      { name: 'Czechia', flag: '🇨🇿', rating: 67 },
      { name: 'South Africa', flag: '🇿🇦', rating: 62 },
    ],
    results: [
      { a: 'Mexico', b: 'South Africa', ga: 2, gb: 0 },
      { a: 'South Korea', b: 'Czechia', ga: 2, gb: 1 },
      { a: 'Czechia', b: 'South Africa', ga: 1, gb: 1 },
      { a: 'Mexico', b: 'South Korea', ga: 1, gb: 0 },
    ],
  },
  {
    id: 'B',
    teams: [
      { name: 'Switzerland', flag: '🇨🇭', rating: 77 },
      { name: 'Canada', flag: '🇨🇦', rating: 73 },
      { name: 'Bosnia & Herzegovina', flag: '🇧🇦', rating: 65 },
      { name: 'Qatar', flag: '🇶🇦', rating: 60 },
    ],
    results: [
      { a: 'Canada', b: 'Bosnia & Herzegovina', ga: 1, gb: 1 },
      { a: 'Switzerland', b: 'Qatar', ga: 1, gb: 1 },
      { a: 'Switzerland', b: 'Bosnia & Herzegovina', ga: 4, gb: 1 },
      { a: 'Canada', b: 'Qatar', ga: 6, gb: 0 },
    ],
  },
  {
    id: 'C',
    teams: [
      { name: 'Brazil', flag: '🇧🇷', rating: 91 },
      { name: 'Morocco', flag: '🇲🇦', rating: 79 },
      { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', rating: 71 },
      { name: 'Haiti', flag: '🇭🇹', rating: 56 },
    ],
    results: [
      { a: 'Brazil', b: 'Morocco', ga: 1, gb: 1 },
      { a: 'Scotland', b: 'Haiti', ga: 1, gb: 0 },
      { a: 'Scotland', b: 'Morocco', ga: 0, gb: 1 },
      { a: 'Brazil', b: 'Haiti', ga: 3, gb: 0 },
    ],
  },
  {
    id: 'D',
    teams: [
      { name: 'United States', flag: '🇺🇸', rating: 76 },
      { name: 'Türkiye', flag: '🇹🇷', rating: 74 },
      { name: 'Paraguay', flag: '🇵🇾', rating: 70 },
      { name: 'Australia', flag: '🇦🇺', rating: 67 },
    ],
    results: [
      { a: 'United States', b: 'Paraguay', ga: 4, gb: 1 },
      { a: 'Australia', b: 'Türkiye', ga: 2, gb: 0 },
      { a: 'United States', b: 'Australia', ga: 2, gb: 0 },
      { a: 'Türkiye', b: 'Paraguay', ga: 0, gb: 1 },
    ],
  },
  {
    id: 'E',
    teams: [
      { name: 'Germany', flag: '🇩🇪', rating: 88 },
      { name: 'Ecuador', flag: '🇪🇨', rating: 73 },
      { name: 'Ivory Coast', flag: '🇨🇮', rating: 71 },
      { name: 'Curaçao', flag: '🇨🇼', rating: 54 },
    ],
    results: [
      { a: 'Germany', b: 'Curaçao', ga: 7, gb: 1 },
      { a: 'Ivory Coast', b: 'Ecuador', ga: 1, gb: 0 },
      { a: 'Germany', b: 'Ivory Coast', ga: 2, gb: 1 },
      { a: 'Ecuador', b: 'Curaçao', ga: 0, gb: 0 },
    ],
  },
  {
    id: 'F',
    teams: [
      { name: 'Netherlands', flag: '🇳🇱', rating: 85 },
      { name: 'Japan', flag: '🇯🇵', rating: 77 },
      { name: 'Sweden', flag: '🇸🇪', rating: 75 },
      { name: 'Tunisia', flag: '🇹🇳', rating: 64 },
    ],
    results: [
      { a: 'Netherlands', b: 'Japan', ga: 2, gb: 2 },
      { a: 'Sweden', b: 'Tunisia', ga: 5, gb: 1 },
      { a: 'Netherlands', b: 'Sweden', ga: 5, gb: 1 },
      { a: 'Japan', b: 'Tunisia', ga: 4, gb: 0 },
    ],
  },
  {
    id: 'G',
    teams: [
      { name: 'Belgium', flag: '🇧🇪', rating: 83 },
      { name: 'Iran', flag: '🇮🇷', rating: 70 },
      { name: 'Egypt', flag: '🇪🇬', rating: 69 },
      { name: 'New Zealand', flag: '🇳🇿', rating: 60 },
    ],
    results: [
      { a: 'Belgium', b: 'Egypt', ga: 1, gb: 1 },
      { a: 'Iran', b: 'New Zealand', ga: 2, gb: 2 },
    ],
  },
  {
    id: 'H',
    teams: [
      { name: 'Spain', flag: '🇪🇸', rating: 92 },
      { name: 'Uruguay', flag: '🇺🇾', rating: 81 },
      { name: 'Saudi Arabia', flag: '🇸🇦', rating: 62 },
      { name: 'Cabo Verde', flag: '🇨🇻', rating: 58 },
    ],
    results: [
      { a: 'Spain', b: 'Cabo Verde', ga: 0, gb: 0 },
      { a: 'Saudi Arabia', b: 'Uruguay', ga: 1, gb: 1 },
    ],
  },
  {
    id: 'I',
    teams: [
      { name: 'France', flag: '🇫🇷', rating: 90 },
      { name: 'Norway', flag: '🇳🇴', rating: 80 },
      { name: 'Senegal', flag: '🇸🇳', rating: 79 },
      { name: 'Iraq', flag: '🇮🇶', rating: 60 },
    ],
    results: [
      { a: 'France', b: 'Senegal', ga: 3, gb: 1 },
      { a: 'Norway', b: 'Iraq', ga: 4, gb: 1 },
    ],
  },
  {
    id: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷', rating: 93 },
      { name: 'Austria', flag: '🇦🇹', rating: 75 },
      { name: 'Algeria', flag: '🇩🇿', rating: 71 },
      { name: 'Jordan', flag: '🇯🇴', rating: 58 },
    ],
    results: [
      { a: 'Argentina', b: 'Algeria', ga: 3, gb: 0 },
      { a: 'Austria', b: 'Jordan', ga: 3, gb: 1 },
    ],
  },
  {
    id: 'K',
    teams: [
      { name: 'Portugal', flag: '🇵🇹', rating: 86 },
      { name: 'Colombia', flag: '🇨🇴', rating: 81 },
      { name: 'DR Congo', flag: '🇨🇩', rating: 67 },
      { name: 'Uzbekistan', flag: '🇺🇿', rating: 63 },
    ],
    results: [
      { a: 'Portugal', b: 'DR Congo', ga: 1, gb: 1 },
      { a: 'Colombia', b: 'Uzbekistan', ga: 3, gb: 1 },
    ],
  },
  {
    id: 'L',
    teams: [
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 87 },
      { name: 'Croatia', flag: '🇭🇷', rating: 80 },
      { name: 'Ghana', flag: '🇬🇭', rating: 69 },
      { name: 'Panama', flag: '🇵🇦', rating: 60 },
    ],
    results: [
      { a: 'England', b: 'Croatia', ga: 4, gb: 2 },
      { a: 'Ghana', b: 'Panama', ga: 1, gb: 0 },
    ],
  },
]
