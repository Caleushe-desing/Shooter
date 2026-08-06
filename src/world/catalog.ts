/** Chilean open-world catalog: flora, fauna, minerals and loot. */

export type ResourceId =
  | 'maqui'
  | 'pinon'
  | 'copihue'
  | 'fruta_quillay'
  | 'hoja_boldo'
  | 'carne'
  | 'lana'
  | 'cuero'
  | 'cobre'
  | 'litio'
  | 'oro'
  | 'salitre'
  | 'piedra'
  | 'madera'

export type FloraKind =
  | 'araucaria'
  | 'alerce'
  | 'quillay'
  | 'boldo'
  | 'canelo'
  | 'espino'
  | 'maqui'
  | 'copihue'
  | 'arrayan'

export type FaunaKind = 'caballo' | 'oveja' | 'perro' | 'guanaco'

export type MineralKind = 'cobre' | 'litio' | 'oro' | 'salitre' | 'piedra'

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  maqui: 'Maqui',
  pinon: 'Piñón',
  copihue: 'Copihue',
  fruta_quillay: 'Fruto quillay',
  hoja_boldo: 'Hoja de boldo',
  carne: 'Carne',
  lana: 'Lana',
  cuero: 'Cuero',
  cobre: 'Cobre',
  litio: 'Litio',
  oro: 'Oro',
  salitre: 'Salitre',
  piedra: 'Piedra',
  madera: 'Madera',
}

export type FloraDef = {
  kind: FloraKind
  label: string
  /** Collision radius on XZ. */
  radius: number
  height: number
  harvest: ResourceId
  harvestAmount: number
  /** Shots to fell / clear. */
  hp: number
  woodOnFell: number
  /** Seconds until harvest regenerates (0 = once). */
  regenSec: number
  colorTrunk: string
  colorFoliage: string
  colorAccent?: string
}

export type FaunaDef = {
  kind: FaunaKind
  label: string
  radius: number
  height: number
  speed: number
  hp: number
  fleeRange: number
  loot: { id: ResourceId; amount: number }[]
  color: string
  colorAlt: string
}

export type MineralDef = {
  kind: MineralKind
  label: string
  radius: number
  height: number
  hp: number
  yield: ResourceId
  yieldAmount: number
  color: string
  colorVein: string
}

export const FLORA: Record<FloraKind, FloraDef> = {
  araucaria: {
    kind: 'araucaria',
    label: 'Araucaria (Pehuén)',
    radius: 0.55,
    height: 7.5,
    harvest: 'pinon',
    harvestAmount: 3,
    hp: 8,
    woodOnFell: 5,
    regenSec: 45,
    colorTrunk: '#6B4E3A',
    colorFoliage: '#2F6B3A',
    colorAccent: '#C4A35A',
  },
  alerce: {
    kind: 'alerce',
    label: 'Alerce',
    radius: 0.7,
    height: 9,
    harvest: 'madera',
    harvestAmount: 2,
    hp: 12,
    woodOnFell: 8,
    regenSec: 60,
    colorTrunk: '#5A4030',
    colorFoliage: '#1F5A32',
  },
  quillay: {
    kind: 'quillay',
    label: 'Quillay',
    radius: 0.4,
    height: 4.2,
    harvest: 'fruta_quillay',
    harvestAmount: 2,
    hp: 5,
    woodOnFell: 3,
    regenSec: 35,
    colorTrunk: '#7A5A40',
    colorFoliage: '#3F8A4A',
  },
  boldo: {
    kind: 'boldo',
    label: 'Boldo',
    radius: 0.35,
    height: 3.2,
    harvest: 'hoja_boldo',
    harvestAmount: 3,
    hp: 4,
    woodOnFell: 2,
    regenSec: 30,
    colorTrunk: '#6A5038',
    colorFoliage: '#4A7A3A',
  },
  canelo: {
    kind: 'canelo',
    label: 'Canelo',
    radius: 0.45,
    height: 5,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 6,
    woodOnFell: 4,
    regenSec: 40,
    colorTrunk: '#8B5A3C',
    colorFoliage: '#2E6B3E',
  },
  espino: {
    kind: 'espino',
    label: 'Espino',
    radius: 0.3,
    height: 2.6,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 3,
    woodOnFell: 2,
    regenSec: 25,
    colorTrunk: '#5C4030',
    colorFoliage: '#6B8F3A',
  },
  maqui: {
    kind: 'maqui',
    label: 'Maqui',
    radius: 0.28,
    height: 1.8,
    harvest: 'maqui',
    harvestAmount: 4,
    hp: 2,
    woodOnFell: 1,
    regenSec: 20,
    colorTrunk: '#4A3828',
    colorFoliage: '#2A6B3A',
    colorAccent: '#3A1A4A',
  },
  copihue: {
    kind: 'copihue',
    label: 'Copihue',
    radius: 0.2,
    height: 1.4,
    harvest: 'copihue',
    harvestAmount: 2,
    hp: 1,
    woodOnFell: 0,
    regenSec: 25,
    colorTrunk: '#3A6B3A',
    colorFoliage: '#2F7A40',
    colorAccent: '#E23A4A',
  },
  arrayan: {
    kind: 'arrayan',
    label: 'Arrayán',
    radius: 0.38,
    height: 3.6,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 5,
    woodOnFell: 3,
    regenSec: 35,
    colorTrunk: '#C45A6A',
    colorFoliage: '#3A7A48',
  },
}

export const FAUNA: Record<FaunaKind, FaunaDef> = {
  caballo: {
    kind: 'caballo',
    label: 'Caballo',
    radius: 0.55,
    height: 1.7,
    speed: 4.2,
    hp: 6,
    fleeRange: 14,
    loot: [
      { id: 'carne', amount: 3 },
      { id: 'cuero', amount: 2 },
    ],
    color: '#8B5A2B',
    colorAlt: '#F5F0E6',
  },
  oveja: {
    kind: 'oveja',
    label: 'Oveja',
    radius: 0.4,
    height: 1.0,
    speed: 2.4,
    hp: 3,
    fleeRange: 10,
    loot: [
      { id: 'lana', amount: 3 },
      { id: 'carne', amount: 2 },
    ],
    color: '#F2F0EA',
    colorAlt: '#2B2B2B',
  },
  perro: {
    kind: 'perro',
    label: 'Perro',
    radius: 0.35,
    height: 0.85,
    speed: 5.0,
    hp: 3,
    fleeRange: 12,
    loot: [
      { id: 'carne', amount: 1 },
      { id: 'cuero', amount: 1 },
    ],
    color: '#C4A574',
    colorAlt: '#5A4030',
  },
  guanaco: {
    kind: 'guanaco',
    label: 'Guanaco',
    radius: 0.45,
    height: 1.55,
    speed: 4.8,
    hp: 5,
    fleeRange: 16,
    loot: [
      { id: 'carne', amount: 2 },
      { id: 'cuero', amount: 2 },
    ],
    color: '#C48A4A',
    colorAlt: '#F0E0C8',
  },
}

export const MINERALS: Record<MineralKind, MineralDef> = {
  cobre: {
    kind: 'cobre',
    label: 'Veta de cobre',
    radius: 0.55,
    height: 0.9,
    hp: 4,
    yield: 'cobre',
    yieldAmount: 3,
    color: '#4A5560',
    colorVein: '#B87333',
  },
  litio: {
    kind: 'litio',
    label: 'Salmuera / litio',
    radius: 0.7,
    height: 0.35,
    hp: 3,
    yield: 'litio',
    yieldAmount: 2,
    color: '#E8E0D0',
    colorVein: '#D0D8E0',
  },
  oro: {
    kind: 'oro',
    label: 'Veta de oro',
    radius: 0.45,
    height: 0.7,
    hp: 5,
    yield: 'oro',
    yieldAmount: 2,
    color: '#5A5A5A',
    colorVein: '#E8C84A',
  },
  salitre: {
    kind: 'salitre',
    label: 'Salitre',
    radius: 0.6,
    height: 0.4,
    hp: 2,
    yield: 'salitre',
    yieldAmount: 4,
    color: '#F4F0E4',
    colorVein: '#D8D0C0',
  },
  piedra: {
    kind: 'piedra',
    label: 'Roca',
    radius: 0.5,
    height: 0.8,
    hp: 3,
    yield: 'piedra',
    yieldAmount: 3,
    color: '#7A7A78',
    colorVein: '#9A9A96',
  },
}

export const WORLD = {
  /** Playable open radius from origin. */
  size: 160,
  half: 80,
  /** Soft clamp before the invisible rim. */
  rimPadding: 2,
  interactRange: 2.6,
  floraCount: 110,
  faunaCount: 42,
  mineralCount: 36,
  /** How often living flora gently sways / fauna picks a new wander. */
  lifeTickSec: 0.05,
} as const
