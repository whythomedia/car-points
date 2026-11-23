function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

// Legible ink on a colored fill, chosen by luminance — keeps a yellow chip's
// label dark and a navy chip's white.
export function textOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 0.62 ? '#1A1A1C' : '#ffffff'
}
