// 2026 FIFA World Cup — teams and power ratings.
//
// Ratings are a simple 0–100 power estimate used only to PREDICT unplayed
// matches; they have no effect on results already entered. Tweak them freely.
//
// Fixtures, dates, and results live in `fixtures.ts` (the single source of
// truth for matches). Team order here is stable — match ids derive from it.

export type Team = {
  name: string
  flag: string
  rating: number
}

export type Group = {
  id: string
  teams: Team[]
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
  },
  {
    id: 'B',
    teams: [
      { name: 'Switzerland', flag: '🇨🇭', rating: 77 },
      { name: 'Canada', flag: '🇨🇦', rating: 73 },
      { name: 'Bosnia & Herzegovina', flag: '🇧🇦', rating: 65 },
      { name: 'Qatar', flag: '🇶🇦', rating: 60 },
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
  },
  {
    id: 'D',
    teams: [
      { name: 'United States', flag: '🇺🇸', rating: 76 },
      { name: 'Türkiye', flag: '🇹🇷', rating: 74 },
      { name: 'Paraguay', flag: '🇵🇾', rating: 70 },
      { name: 'Australia', flag: '🇦🇺', rating: 67 },
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
  },
  {
    id: 'F',
    teams: [
      { name: 'Netherlands', flag: '🇳🇱', rating: 85 },
      { name: 'Japan', flag: '🇯🇵', rating: 77 },
      { name: 'Sweden', flag: '🇸🇪', rating: 75 },
      { name: 'Tunisia', flag: '🇹🇳', rating: 64 },
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
  },
  {
    id: 'H',
    teams: [
      { name: 'Spain', flag: '🇪🇸', rating: 92 },
      { name: 'Uruguay', flag: '🇺🇾', rating: 81 },
      { name: 'Saudi Arabia', flag: '🇸🇦', rating: 62 },
      { name: 'Cabo Verde', flag: '🇨🇻', rating: 58 },
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
  },
  {
    id: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷', rating: 93 },
      { name: 'Austria', flag: '🇦🇹', rating: 75 },
      { name: 'Algeria', flag: '🇩🇿', rating: 71 },
      { name: 'Jordan', flag: '🇯🇴', rating: 58 },
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
  },
  {
    id: 'L',
    teams: [
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 87 },
      { name: 'Croatia', flag: '🇭🇷', rating: 80 },
      { name: 'Ghana', flag: '🇬🇭', rating: 69 },
      { name: 'Panama', flag: '🇵🇦', rating: 60 },
    ],
  },
]

export function teamByName(name: string): Team | undefined {
  for (const g of GROUPS) {
    const t = g.teams.find((t) => t.name === name)
    if (t) return t
  }
  return undefined
}
