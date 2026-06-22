// Family pick'em picks for the matches played so far, transcribed from the
// hand-filled sheet and oriented to the real fixture home/away. Seed data;
// Redis-entered picks layer on top. Blank cells score nothing.

export type SeedPick = {
  group: string
  home: string
  away: string
  picks: Record<string, { ga: number; gb: number }>
}

export const SEED_PICKS: SeedPick[] = [
  { group: 'A', home: "Mexico", away: "South Korea", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'A', home: "Mexico", away: "South Africa", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 3, gb: 1 } } },
  { group: 'A', home: "South Korea", away: "Czechia", picks: { Dad: { ga: 0, gb: 2 }, Mom: { ga: 0, gb: 1 }, Max: { ga: 2, gb: 0 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'A', home: "Czechia", away: "South Africa", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 1, gb: 1 }, Max: { ga: 1, gb: 3 }, Owen
: { ga: 1, gb: 0 } } },
  { group: 'B', home: "Switzerland", away: "Bosnia & Herzegovina", picks: { Dad: { ga: 1, gb: 1 }, Mom: { ga: 2, gb: 0 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'B', home: "Qatar", away: "Switzerland", picks: { Dad: { ga: 0, gb: 1 }, Mom: { ga: 1, gb: 1 }, Max: { ga: 0, gb: 1 }, Owen
: { ga: 1, gb: 2 } } },
  { group: 'B', home: "Canada", away: "Bosnia & Herzegovina", picks: { Dad: { ga: 3, gb: 2 }, Mom: { ga: 1, gb: 0 }, Max: { ga: 1, gb: 0 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'B', home: "Canada", away: "Qatar", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'C', home: "Brazil", away: "Morocco", picks: { Dad: { ga: 0, gb: 2 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 1, gb: 0 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'C', home: "Brazil", away: "Haiti", picks: { Dad: { ga: 3, gb: 0 }, Mom: { ga: 3, gb: 0 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 3, gb: 1 } } },
  { group: 'C', home: "Scotland", away: "Morocco", picks: { Dad: { ga: 1, gb: 2 }, Mom: { ga: 1, gb: 2 }, Max: { ga: 1, gb: 3 }, Owen
: { ga: 0, gb: 2 } } },
  { group: 'C', home: "Haiti", away: "Scotland", picks: { Dad: { ga: 0, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 0, gb: 2 }, Owen
: { ga: 0, gb: 2 } } },
  { group: 'D', home: "United States", away: "Paraguay", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 3, gb: 1 } } },
  { group: 'D', home: "United States", away: "Australia", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'D', home: "Türkiye", away: "Paraguay", picks: { Dad: { ga: 1, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'D', home: "Australia", away: "Türkiye", picks: { Dad: { ga: 1, gb: 2 }, Mom: { ga: 1, gb: 0 }, Owen
: { ga: 0, gb: 2 } } },
  { group: 'E', home: "Germany", away: "Ivory Coast", picks: { Dad: { ga: 3, gb: 1 }, Mom: { ga: 3, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 4, gb: 0 } } },
  { group: 'E', home: "Germany", away: "Curaçao", picks: { Dad: { ga: 3, gb: 0 }, Mom: { ga: 3, gb: 1 }, Max: { ga: 2, gb: 0 }, Owen
: { ga: 4, gb: 0 } } },
  { group: 'E', home: "Ivory Coast", away: "Ecuador", picks: { Dad: { ga: 0, gb: 3 }, Mom: { ga: 0, gb: 1 }, Max: { ga: 1, gb: 1 }, Owen
: { ga: 3, gb: 2 } } },
  { group: 'E', home: "Ecuador", away: "Curaçao", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 1, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'F', home: "Netherlands", away: "Japan", picks: { Dad: { ga: 1, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 0 }, Owen
: { ga: 1, gb: 0 } } },
  { group: 'F', home: "Netherlands", away: "Sweden", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 2, gb: 0 }, Max: { ga: 3, gb: 0 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'F', home: "Tunisia", away: "Japan", picks: { Dad: { ga: 0, gb: 3 }, Mom: { ga: 1, gb: 2 }, Max: { ga: 1, gb: 3 }, Owen
: { ga: 1, gb: 2 } } },
  { group: 'F', home: "Sweden", away: "Tunisia", picks: { Dad: { ga: 1, gb: 0 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 3, gb: 1 } } },
  { group: 'G', home: "Belgium", away: "Iran", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'G', home: "Belgium", away: "Egypt", picks: { Dad: { ga: 0, gb: 2 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 0 }, Owen
: { ga: 3, gb: 2 } } },
  { group: 'G', home: "Iran", away: "New Zealand", picks: { Dad: { ga: 3, gb: 2 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 3, gb: 2 } } },
  { group: 'G', home: "New Zealand", away: "Egypt", picks: { Dad: { ga: 1, gb: 2 }, Mom: { ga: 1, gb: 2 } } },
  { group: 'H', home: "Spain", away: "Saudi Arabia", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 2, gb: 0 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'H', home: "Spain", away: "Cabo Verde", picks: { Dad: { ga: 3, gb: 0 }, Mom: { ga: 6, gb: 1 }, Max: { ga: 4, gb: 0 }, Owen
: { ga: 5, gb: 0 } } },
  { group: 'H', home: "Saudi Arabia", away: "Uruguay", picks: { Dad: { ga: 1, gb: 2 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 0, gb: 1 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'H', home: "Uruguay", away: "Cabo Verde", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 1, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'I', home: "France", away: "Senegal", picks: { Dad: { ga: 3, gb: 1 }, Mom: { ga: 2, gb: 0 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'I', home: "Iraq", away: "Norway", picks: { Dad: { ga: 2, gb: 4 }, Mom: { ga: 0, gb: 3 }, Max: { ga: 1, gb: 2 }, Owen
: { ga: 1, gb: 3 } } },
  { group: 'J', home: "Argentina", away: "Algeria", picks: { Dad: { ga: 2, gb: 0 }, Mom: { ga: 3, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 3, gb: 0 } } },
  { group: 'J', home: "Austria", away: "Jordan", picks: { Dad: { ga: 1, gb: 1 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 1 } } },
  { group: 'K', home: "Portugal", away: "DR Congo", picks: { Dad: { ga: 3, gb: 0 }, Mom: { ga: 3, gb: 1 }, Max: { ga: 3, gb: 1 }, Owen
: { ga: 2, gb: 0 } } },
  { group: 'K', home: "Uzbekistan", away: "Colombia", picks: { Dad: { ga: 0, gb: 1 }, Mom: { ga: 0, gb: 2 }, Max: { ga: 1, gb: 3 }, Owen
: { ga: 1, gb: 1 } } },
  { group: 'L', home: "England", away: "Croatia", picks: { Dad: { ga: 2, gb: 1 }, Mom: { ga: 1, gb: 0 }, Max: { ga: 2, gb: 1 }, Owen
: { ga: 3, gb: 2 } } },
  { group: 'L', home: "Ghana", away: "Panama", picks: { Dad: { ga: 1, gb: 2 }, Mom: { ga: 2, gb: 1 }, Max: { ga: 1, gb: 3 }, Owen
: { ga: 2, gb: 1 } } },
  // Argentina v Austria — picks entered after the result was logged.
  { group: 'J', home: "Argentina", away: "Austria", picks: { Dad: { ga: 3, gb: 1 }, Mom: { ga: 2, gb: 0 }, Max: { ga: 3, gb: 1 }, Owen: { ga: 4, gb: 1 } } },
]
