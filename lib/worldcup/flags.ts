// Team name → flag asset code. Badges live in /public/flags/<code>.png as
// 256px circular "ball" crops (style guide §3). Keyed by the exact team names
// used in data.ts.

export const FLAG_CODES: Record<string, string> = {
  Mexico: 'mx',
  'South Korea': 'kr',
  Czechia: 'cz',
  'South Africa': 'za',
  Switzerland: 'ch',
  Canada: 'ca',
  'Bosnia & Herzegovina': 'ba',
  Qatar: 'qa',
  Brazil: 'br',
  Morocco: 'ma',
  Scotland: 'gb-sct',
  Haiti: 'ht',
  'United States': 'us',
  Türkiye: 'tr',
  Paraguay: 'py',
  Australia: 'au',
  Germany: 'de',
  Ecuador: 'ec',
  'Ivory Coast': 'ci',
  Curaçao: 'cw',
  Netherlands: 'nl',
  Japan: 'jp',
  Sweden: 'se',
  Tunisia: 'tn',
  Belgium: 'be',
  Iran: 'ir',
  Egypt: 'eg',
  'New Zealand': 'nz',
  Spain: 'es',
  Uruguay: 'uy',
  'Saudi Arabia': 'sa',
  'Cabo Verde': 'cv',
  France: 'fr',
  Norway: 'no',
  Senegal: 'sn',
  Iraq: 'iq',
  Argentina: 'ar',
  Austria: 'at',
  Algeria: 'dz',
  Jordan: 'jo',
  Portugal: 'pt',
  Colombia: 'co',
  'DR Congo': 'cd',
  Uzbekistan: 'uz',
  England: 'gb-eng',
  Croatia: 'hr',
  Ghana: 'gh',
  Panama: 'pa',
}

export function flagSrc(teamName: string): string | null {
  const code = FLAG_CODES[teamName]
  return code ? `/flags/${code}.png` : null
}
