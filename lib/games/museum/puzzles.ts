// The museum's puzzles, one per chapter. Finishing one means its treasure is
// sitting in the lobby case. Client-safe (no server imports).

export type MuseumPuzzle = { treasure: string; chapter: number; label: string }

export const MUSEUM_PUZZLES: MuseumPuzzle[] = [
  { treasure: 'bell', chapter: 1, label: 'the Hall of Clocks' },
  { treasure: 'star', chapter: 2, label: 'the Painting Gallery' },
]

// Car points for the first time a kid finishes each puzzle.
export const MUSEUM_BONUS = 5

export function puzzleByTreasure(treasure: string): MuseumPuzzle | null {
  return MUSEUM_PUZZLES.find((p) => p.treasure === treasure) ?? null
}
