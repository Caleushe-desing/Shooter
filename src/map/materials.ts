/** Bright, vivid settlement palette — stone, wood, earth with clear contrast. */
export const MAT = {
  dirt: '#8B7348',
  packedEarth: '#A08858',
  grass: '#6FA85A',
  stone: '#B0A898',
  stoneDark: '#8A8276',
  stoneLight: '#D0C8B8',
  adobe: '#C4A882',
  adobeDark: '#A88860',
  wood: '#8B5E34',
  woodOld: '#7A4E28',
  woodPale: '#C4A06A',
  roofTile: '#8B5A4A',
  roofThatch: '#A89058',
  arenaSand: '#E0C890',
  arenaStone: '#B8B0A0',
  flagRed: '#E04535',
  flagPole: '#4A4540',
  /** High-contrast trim for doors / windows / edges */
  trim: '#F0E8D0',
  hangar: '#D8DEE6',
  hangarBeam: '#9AA8B8',
  led: '#F5FBFF',
} as const

export type MatKey = keyof typeof MAT
