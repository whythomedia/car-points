// World Cup brand tokens — palette + people, per the project style guide.
// One source of truth: every component imports colors from here.

// Per-group categorical palette (style guide §1). 12 distinct hues, A–L.
export const GROUP_COLORS: Record<string, string> = {
  A: '#D60000',
  B: '#FF3D00',
  C: '#EDFF42',
  D: '#B0EB00',
  E: '#00C752',
  F: '#004D40',
  G: '#2196F2',
  H: '#304FFF',
  I: '#1A247D',
  J: '#6100EB',
  K: '#BA69C7',
  L: '#E81F63',
}

// The family pickers and their accent colors (style guide entity palette).
// Edit this one list to change who plays the pick'em game.
export type Predictor = { name: string; color: string }
export const PREDICTORS: Predictor[] = [
  { name: 'Dad', color: '#00C752' },
  { name: 'Mom', color: '#BA69C7' },
  { name: 'Max', color: '#304FFF' },
  { name: 'Owen', color: '#D60000' },
]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

// Legible ink on a colored fill, chosen by luminance (style guide §1 rule),
// never hardcoded — keeps a yellow chip's label dark and a navy chip's white.
export function textOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 0.62 ? '#1A1A1C' : '#ffffff'
}
