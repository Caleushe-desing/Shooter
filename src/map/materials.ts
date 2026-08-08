/** Earthy fortified-settlement palette (stone, old wood, dirt). */
export const MAT = {
  dirt: '#6B5A3E',
  packedEarth: '#7A6848',
  grass: '#5F7A4A',
  stone: '#8A8478',
  stoneDark: '#6A645A',
  stoneLight: '#A39A8C',
  adobe: '#9C8B72',
  adobeDark: '#7E6E58',
  wood: '#6E4B2E',
  woodOld: '#5A3D26',
  woodPale: '#8B6A42',
  roofTile: '#5C4A3A',
  roofThatch: '#7A6A48',
  arenaSand: '#C2A878',
  arenaStone: '#8E8678',
  flagRed: '#B33A2E',
  flagPole: '#3A342E',
} as const

export type MatKey = keyof typeof MAT
