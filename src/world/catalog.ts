/** Colonist catalog: biomes, natural resources, craft recipes, buildings. */

export type ResourceId =
  // Food & survival
  | 'bayas'
  | 'carne'
  | 'pez'
  | 'agua'
  | 'comida_cocida'
  // Organic / soft
  | 'madera'
  | 'lena'
  | 'fibra'
  | 'cuero'
  | 'lana'
  // Earth & stone
  | 'piedra'
  | 'arena'
  | 'arcilla'
  | 'caliza'
  | 'carbon'
  // Metals & minerals
  | 'hierro'
  | 'cobre'
  | 'oro'
  | 'sal'
  | 'diamante'
  // Crops
  | 'trigo'
  | 'maiz'
  | 'tomate'
  | 'manzana'
  // Crafted materials
  | 'tablas'
  | 'ladrillo'
  | 'cemento'
  | 'concreto'
  | 'cuerda'
  | 'clavo'
  | 'lingote_hierro'
  | 'herramienta'
  | 'pala'
  | 'jabon'
  | 'tierra'
  // Clothing
  | 'tunica'
  | 'pantalon'
  | 'capa'
  | 'botas'

export type BiomeId =
  | 'bosque'
  | 'pradera'
  | 'lago'
  | 'rocoso'
  | 'humedal'
  | 'huerto'
  | 'montana'

export type FloraKind =
  | 'roble'
  | 'pino'
  | 'sauce'
  | 'abeto'
  | 'abedul'
  | 'secuoya'
  | 'olivo'
  | 'manzano'
  | 'arbusto_bayas'
  | 'hierba_fibra'
  | 'juncos'
  | 'trigo'
  | 'maiz'
  | 'tomatera'

export type FaunaKind = 'ciervo' | 'oveja' | 'conejo' | 'pato'

export type MineralKind =
  | 'piedra'
  | 'arena'
  | 'arcilla'
  | 'caliza'
  | 'carbon'
  | 'hierro'
  | 'cobre'
  | 'oro'
  | 'sal'
  | 'diamante'

export type MineKind = 'carbon_subterranea' | 'cobre_cielo_abierto' | 'cobre_interior' | 'diamante_profunda'

export type BuildingKind = 'refugio' | 'hoguera' | 'almacen' | 'tramo_calle'

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  bayas: 'Bayas',
  carne: 'Carne',
  pez: 'Pez',
  agua: 'Agua dulce',
  comida_cocida: 'Comida cocida',
  madera: 'Madera',
  lena: 'Leña',
  fibra: 'Fibra vegetal',
  cuero: 'Cuero',
  lana: 'Lana',
  piedra: 'Piedra',
  arena: 'Arena',
  arcilla: 'Arcilla',
  caliza: 'Caliza',
  carbon: 'Carbón',
  hierro: 'Mineral de hierro',
  cobre: 'Cobre',
  oro: 'Oro',
  sal: 'Sal',
  diamante: 'Diamante',
  trigo: 'Trigo',
  maiz: 'Maíz',
  tomate: 'Tomate',
  manzana: 'Manzana',
  tablas: 'Tablas',
  ladrillo: 'Ladrillo',
  cemento: 'Cemento',
  concreto: 'Concreto',
  cuerda: 'Cuerda',
  clavo: 'Clavos',
  lingote_hierro: 'Lingote de hierro',
  herramienta: 'Herramienta',
  pala: 'Pala',
  jabon: 'Jabón',
  tierra: 'Tierra',
  tunica: 'Túnica',
  pantalon: 'Pantalón',
  capa: 'Capa',
  botas: 'Botas',
}

export type ResourceCategory = 'comida' | 'natural' | 'mineral' | 'crafteado' | 'ropa' | 'herramienta'

export const RESOURCE_CATEGORY: Record<ResourceId, ResourceCategory> = {
  bayas: 'comida',
  carne: 'comida',
  pez: 'comida',
  agua: 'comida',
  comida_cocida: 'comida',
  madera: 'natural',
  lena: 'natural',
  fibra: 'natural',
  cuero: 'natural',
  lana: 'natural',
  tierra: 'natural',
  piedra: 'mineral',
  arena: 'mineral',
  arcilla: 'mineral',
  caliza: 'mineral',
  carbon: 'mineral',
  hierro: 'mineral',
  cobre: 'mineral',
  oro: 'mineral',
  sal: 'mineral',
  diamante: 'mineral',
  trigo: 'comida',
  maiz: 'comida',
  tomate: 'comida',
  manzana: 'comida',
  tablas: 'crafteado',
  ladrillo: 'crafteado',
  cemento: 'crafteado',
  concreto: 'crafteado',
  cuerda: 'crafteado',
  clavo: 'crafteado',
  lingote_hierro: 'crafteado',
  jabon: 'crafteado',
  herramienta: 'herramienta',
  pala: 'herramienta',
  tunica: 'ropa',
  pantalon: 'ropa',
  capa: 'ropa',
  botas: 'ropa',
}

export type EquipSlot = 'torso' | 'piernas' | 'capa' | 'pies' | 'mano'

export type FloraDef = {
  kind: FloraKind
  label: string
  radius: number
  height: number
  harvest: ResourceId
  harvestAmount: number
  hp: number
  woodOnFell: number
  regenSec: number
  biomes: BiomeId[]
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
  biomes: BiomeId[]
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
  /** Hidden until scanned (buried deposits). Surface stones stay visible. */
  buried: boolean
  biomes: BiomeId[]
  color: string
  colorVein: string
}

export type RecipeDef = {
  id: string
  label: string
  description: string
  inputs: { id: ResourceId; amount: number }[]
  output: { id: ResourceId; amount: number }
  /** Seconds of work (instant for stage A UI click). */
  workSec: number
}

export type BuildingDef = {
  kind: BuildingKind
  label: string
  description: string
  cost: { id: ResourceId; amount: number }[]
  width: number
  depth: number
  height: number
  color: string
}

export const FLORA: Record<FloraKind, FloraDef> = {
  roble: {
    kind: 'roble',
    label: 'Roble',
    radius: 0.65,
    height: 8.2,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 11,
    woodOnFell: 7,
    regenSec: 0,
    biomes: ['bosque'],
    colorTrunk: '#4A3424',
    colorFoliage: '#2A5A2E',
  },
  pino: {
    kind: 'pino',
    label: 'Pino',
    radius: 0.5,
    height: 9.5,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 8,
    woodOnFell: 5,
    regenSec: 0,
    biomes: ['bosque', 'montana', 'rocoso'],
    colorTrunk: '#5A4634',
    colorFoliage: '#1A4A28',
  },
  sauce: {
    kind: 'sauce',
    label: 'Sauce llorón',
    radius: 0.55,
    height: 6.5,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 7,
    woodOnFell: 4,
    regenSec: 0,
    biomes: ['lago', 'humedal'],
    colorTrunk: '#6A5A3A',
    colorFoliage: '#3A7A48',
  },
  abeto: {
    kind: 'abeto',
    label: 'Abeto',
    radius: 0.55,
    height: 11,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 9,
    woodOnFell: 6,
    regenSec: 0,
    biomes: ['montana', 'bosque'],
    colorTrunk: '#4A3A28',
    colorFoliage: '#163A22',
  },
  abedul: {
    kind: 'abedul',
    label: 'Abedul',
    radius: 0.4,
    height: 7,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 6,
    woodOnFell: 4,
    regenSec: 0,
    biomes: ['bosque', 'pradera'],
    colorTrunk: '#E8E0D4',
    colorFoliage: '#4A8A3A',
  },
  secuoya: {
    kind: 'secuoya',
    label: 'Secuoya',
    radius: 1.1,
    height: 16,
    harvest: 'madera',
    harvestAmount: 2,
    hp: 18,
    woodOnFell: 14,
    regenSec: 0,
    biomes: ['bosque'],
    colorTrunk: '#6A3A28',
    colorFoliage: '#1A4A28',
  },
  olivo: {
    kind: 'olivo',
    label: 'Olivo',
    radius: 0.5,
    height: 4.5,
    harvest: 'madera',
    harvestAmount: 1,
    hp: 7,
    woodOnFell: 3,
    regenSec: 0,
    biomes: ['huerto', 'pradera'],
    colorTrunk: '#6A5A40',
    colorFoliage: '#6A8A4A',
    colorAccent: '#C8C080',
  },
  manzano: {
    kind: 'manzano',
    label: 'Manzano',
    radius: 0.45,
    height: 4.2,
    harvest: 'manzana',
    harvestAmount: 4,
    hp: 5,
    woodOnFell: 2,
    regenSec: 50,
    biomes: ['huerto', 'bosque'],
    colorTrunk: '#5A4030',
    colorFoliage: '#3A7A38',
    colorAccent: '#C43A3A',
  },
  arbusto_bayas: {
    kind: 'arbusto_bayas',
    label: 'Arbusto de bayas',
    radius: 0.35,
    height: 1.2,
    harvest: 'bayas',
    harvestAmount: 3,
    hp: 2,
    woodOnFell: 0,
    regenSec: 40,
    biomes: ['bosque', 'pradera', 'humedal', 'huerto'],
    colorTrunk: '#4A3828',
    colorFoliage: '#3A7A40',
    colorAccent: '#C43A5A',
  },
  hierba_fibra: {
    kind: 'hierba_fibra',
    label: 'Hierba fibrosa',
    radius: 0.25,
    height: 0.9,
    harvest: 'fibra',
    harvestAmount: 2,
    hp: 1,
    woodOnFell: 0,
    regenSec: 25,
    biomes: ['pradera', 'humedal'],
    colorTrunk: '#6A8A3A',
    colorFoliage: '#7AAA4A',
  },
  juncos: {
    kind: 'juncos',
    label: 'Juncos',
    radius: 0.3,
    height: 1.4,
    harvest: 'fibra',
    harvestAmount: 3,
    hp: 1,
    woodOnFell: 0,
    regenSec: 30,
    biomes: ['lago', 'humedal'],
    colorTrunk: '#8A9A4A',
    colorFoliage: '#6A8A40',
  },
  trigo: {
    kind: 'trigo',
    label: 'Trigo',
    radius: 0.2,
    height: 1.1,
    harvest: 'trigo',
    harvestAmount: 3,
    hp: 1,
    woodOnFell: 0,
    regenSec: 35,
    biomes: ['huerto', 'pradera'],
    colorTrunk: '#C4A050',
    colorFoliage: '#D4B060',
  },
  maiz: {
    kind: 'maiz',
    label: 'Maíz',
    radius: 0.22,
    height: 1.8,
    harvest: 'maiz',
    harvestAmount: 3,
    hp: 1,
    woodOnFell: 0,
    regenSec: 40,
    biomes: ['huerto'],
    colorTrunk: '#5A8A30',
    colorFoliage: '#6A9A38',
    colorAccent: '#E8C84A',
  },
  tomatera: {
    kind: 'tomatera',
    label: 'Tomatera',
    radius: 0.28,
    height: 1.0,
    harvest: 'tomate',
    harvestAmount: 3,
    hp: 1,
    woodOnFell: 0,
    regenSec: 30,
    biomes: ['huerto'],
    colorTrunk: '#3A6A28',
    colorFoliage: '#4A8A30',
    colorAccent: '#E04030',
  },
}

export const FAUNA: Record<FaunaKind, FaunaDef> = {
  ciervo: {
    kind: 'ciervo',
    label: 'Ciervo',
    radius: 0.45,
    height: 1.5,
    speed: 5.2,
    hp: 5,
    fleeRange: 16,
    loot: [
      { id: 'carne', amount: 3 },
      { id: 'cuero', amount: 2 },
    ],
    biomes: ['bosque', 'pradera'],
    color: '#A87848',
    colorAlt: '#F0E0C8',
  },
  oveja: {
    kind: 'oveja',
    label: 'Oveja',
    radius: 0.4,
    height: 1.0,
    speed: 3.2,
    hp: 3,
    fleeRange: 12,
    loot: [
      { id: 'carne', amount: 2 },
      { id: 'lana', amount: 3 },
    ],
    biomes: ['pradera'],
    color: '#F2F0EA',
    colorAlt: '#C8C4B8',
  },
  conejo: {
    kind: 'conejo',
    label: 'Conejo',
    radius: 0.22,
    height: 0.45,
    speed: 6.5,
    hp: 1,
    fleeRange: 10,
    loot: [
      { id: 'carne', amount: 1 },
      { id: 'cuero', amount: 1 },
    ],
    biomes: ['bosque', 'pradera'],
    color: '#C4A574',
    colorAlt: '#F5E6D3',
  },
  pato: {
    kind: 'pato',
    label: 'Pato',
    radius: 0.25,
    height: 0.5,
    speed: 4.0,
    hp: 1,
    fleeRange: 14,
    loot: [
      { id: 'carne', amount: 1 },
      { id: 'pez', amount: 0 },
    ],
    biomes: ['lago', 'humedal'],
    color: '#4A6A3A',
    colorAlt: '#E8C84A',
  },
}

export const MINERALS: Record<MineralKind, MineralDef> = {
  piedra: {
    kind: 'piedra',
    label: 'Afloramiento de piedra',
    radius: 0.5,
    height: 0.8,
    hp: 3,
    yield: 'piedra',
    yieldAmount: 3,
    buried: false,
    biomes: ['rocoso', 'bosque', 'pradera'],
    color: '#7A7A78',
    colorVein: '#9A9A96',
  },
  arena: {
    kind: 'arena',
    label: 'Banco de arena',
    radius: 0.7,
    height: 0.25,
    hp: 2,
    yield: 'arena',
    yieldAmount: 4,
    buried: false,
    biomes: ['lago', 'pradera'],
    color: '#E8D5A8',
    colorVein: '#D4C090',
  },
  arcilla: {
    kind: 'arcilla',
    label: 'Depósito de arcilla',
    radius: 0.55,
    height: 0.35,
    hp: 2,
    yield: 'arcilla',
    yieldAmount: 3,
    buried: false,
    biomes: ['humedal', 'lago'],
    color: '#A06848',
    colorVein: '#8A5038',
  },
  caliza: {
    kind: 'caliza',
    label: 'Veta de caliza',
    radius: 0.5,
    height: 0.7,
    hp: 4,
    yield: 'caliza',
    yieldAmount: 3,
    buried: true,
    biomes: ['rocoso'],
    color: '#E8E4D8',
    colorVein: '#D0CCC0',
  },
  carbon: {
    kind: 'carbon',
    label: 'Carbón (mina)',
    radius: 0.45,
    height: 0.55,
    hp: 4,
    yield: 'carbon',
    yieldAmount: 3,
    buried: true,
    biomes: ['montana', 'rocoso'],
    color: '#2A2A2C',
    colorVein: '#4A4A4C',
  },
  hierro: {
    kind: 'hierro',
    label: 'Mineral de hierro',
    radius: 0.5,
    height: 0.65,
    hp: 5,
    yield: 'hierro',
    yieldAmount: 2,
    buried: true,
    biomes: ['montana', 'rocoso'],
    color: '#5A4038',
    colorVein: '#8A5A48',
  },
  cobre: {
    kind: 'cobre',
    label: 'Cobre',
    radius: 0.45,
    height: 0.6,
    hp: 4,
    yield: 'cobre',
    yieldAmount: 2,
    buried: true,
    biomes: ['montana', 'rocoso'],
    color: '#4A5560',
    colorVein: '#B87333',
  },
  oro: {
    kind: 'oro',
    label: 'Veta de oro',
    radius: 0.4,
    height: 0.55,
    hp: 6,
    yield: 'oro',
    yieldAmount: 1,
    buried: true,
    biomes: ['montana', 'rocoso'],
    color: '#5A5A5A',
    colorVein: '#E8C84A',
  },
  sal: {
    kind: 'sal',
    label: 'Depósito de sal',
    radius: 0.5,
    height: 0.3,
    hp: 2,
    yield: 'sal',
    yieldAmount: 3,
    buried: false,
    biomes: ['lago', 'pradera'],
    color: '#F4F0E4',
    colorVein: '#D8D0C0',
  },
  diamante: {
    kind: 'diamante',
    label: 'Diamante (profundo)',
    radius: 0.35,
    height: 0.4,
    hp: 8,
    yield: 'diamante',
    yieldAmount: 1,
    buried: true,
    biomes: ['montana'],
    color: '#1A2A3A',
    colorVein: '#A8E8FF',
  },
}

export type MineDef = {
  kind: MineKind
  label: string
  /** Minerals spawned inside this mine. */
  yields: MineralKind[]
  openPit: boolean
  radius: number
  color: string
}

export const MINES: Record<MineKind, MineDef> = {
  carbon_subterranea: {
    kind: 'carbon_subterranea',
    label: 'Mina de carbón',
    yields: ['carbon'],
    openPit: false,
    radius: 8,
    color: '#2A2A28',
  },
  cobre_cielo_abierto: {
    kind: 'cobre_cielo_abierto',
    label: 'Mina a cielo abierto (cobre)',
    yields: ['cobre', 'piedra'],
    openPit: true,
    radius: 14,
    color: '#8A6A40',
  },
  cobre_interior: {
    kind: 'cobre_interior',
    label: 'Mina interior de cobre',
    yields: ['cobre', 'hierro'],
    openPit: false,
    radius: 7,
    color: '#3A4038',
  },
  diamante_profunda: {
    kind: 'diamante_profunda',
    label: 'Mina profunda de diamante',
    yields: ['diamante', 'carbon'],
    openPit: false,
    radius: 6,
    color: '#1A2430',
  },
}

/** Real-world inspired crafting: stone+sand+cement → concrete, etc. */
export const RECIPES: RecipeDef[] = [
  {
    id: 'tablas',
    label: 'Tablas de madera',
    description: 'Aserrar troncos en tablas para construir.',
    inputs: [{ id: 'madera', amount: 2 }],
    output: { id: 'tablas', amount: 3 },
    workSec: 2,
  },
  {
    id: 'lena',
    label: 'Leña',
    description: 'Partir madera para combustible.',
    inputs: [{ id: 'madera', amount: 1 }],
    output: { id: 'lena', amount: 2 },
    workSec: 1,
  },
  {
    id: 'cuerda',
    label: 'Cuerda',
    description: 'Trenzar fibra vegetal en cuerda resistente.',
    inputs: [{ id: 'fibra', amount: 3 }],
    output: { id: 'cuerda', amount: 1 },
    workSec: 2,
  },
  {
    id: 'ladrillo',
    label: 'Ladrillo',
    description: 'Moldear y cocer arcilla con leña.',
    inputs: [
      { id: 'arcilla', amount: 2 },
      { id: 'lena', amount: 1 },
    ],
    output: { id: 'ladrillo', amount: 2 },
    workSec: 3,
  },
  {
    id: 'cemento',
    label: 'Cemento',
    description: 'Calcinar caliza con arcilla (proceso tipo Portland).',
    inputs: [
      { id: 'caliza', amount: 2 },
      { id: 'arcilla', amount: 1 },
      { id: 'lena', amount: 1 },
    ],
    output: { id: 'cemento', amount: 2 },
    workSec: 4,
  },
  {
    id: 'concreto',
    label: 'Concreto',
    description: 'Mezclar piedra, arena y cemento — base de calles.',
    inputs: [
      { id: 'piedra', amount: 2 },
      { id: 'arena', amount: 2 },
      { id: 'cemento', amount: 1 },
    ],
    output: { id: 'concreto', amount: 2 },
    workSec: 3,
  },
  {
    id: 'lingote_hierro',
    label: 'Lingote de hierro',
    description: 'Fundir mineral de hierro con carbón.',
    inputs: [
      { id: 'hierro', amount: 2 },
      { id: 'carbon', amount: 1 },
    ],
    output: { id: 'lingote_hierro', amount: 1 },
    workSec: 4,
  },
  {
    id: 'clavo',
    label: 'Clavos',
    description: 'Forjar clavos del lingote.',
    inputs: [{ id: 'lingote_hierro', amount: 1 }],
    output: { id: 'clavo', amount: 6 },
    workSec: 2,
  },
  {
    id: 'herramienta',
    label: 'Herramienta de colono',
    description: 'Mango de madera + piedra afilada (o hierro).',
    inputs: [
      { id: 'madera', amount: 1 },
      { id: 'piedra', amount: 2 },
      { id: 'cuerda', amount: 1 },
    ],
    output: { id: 'herramienta', amount: 1 },
    workSec: 3,
  },
  {
    id: 'comida_cocida',
    label: 'Comida cocida',
    description: 'Asar carne o pez con leña.',
    inputs: [
      { id: 'carne', amount: 1 },
      { id: 'lena', amount: 1 },
    ],
    output: { id: 'comida_cocida', amount: 1 },
    workSec: 2,
  },
  {
    id: 'comida_pez',
    label: 'Pez asado',
    description: 'Cocinar pez fresco.',
    inputs: [
      { id: 'pez', amount: 1 },
      { id: 'lena', amount: 1 },
    ],
    output: { id: 'comida_cocida', amount: 1 },
    workSec: 2,
  },
  {
    id: 'jabon',
    label: 'Jabón',
    description: 'Grasa animal + ceniza/sal para higiene.',
    inputs: [
      { id: 'carne', amount: 1 },
      { id: 'sal', amount: 1 },
      { id: 'lena', amount: 1 },
    ],
    output: { id: 'jabon', amount: 1 },
    workSec: 3,
  },
  {
    id: 'pala',
    label: 'Pala',
    description: 'Cavar tierra, arena y arcilla del suelo.',
    inputs: [
      { id: 'madera', amount: 2 },
      { id: 'piedra', amount: 2 },
      { id: 'cuerda', amount: 1 },
    ],
    output: { id: 'pala', amount: 1 },
    workSec: 3,
  },
  {
    id: 'tunica',
    label: 'Túnica de fibra',
    description: 'Ropa básica para el torso.',
    inputs: [
      { id: 'fibra', amount: 6 },
      { id: 'cuerda', amount: 1 },
    ],
    output: { id: 'tunica', amount: 1 },
    workSec: 4,
  },
  {
    id: 'pantalon',
    label: 'Pantalón de cuero',
    description: 'Protege las piernas del matorral.',
    inputs: [
      { id: 'cuero', amount: 3 },
      { id: 'cuerda', amount: 2 },
    ],
    output: { id: 'pantalon', amount: 1 },
    workSec: 4,
  },
  {
    id: 'capa',
    label: 'Capa de lana',
    description: 'Abrigo ligero sobre los hombros.',
    inputs: [
      { id: 'lana', amount: 4 },
      { id: 'cuerda', amount: 1 },
    ],
    output: { id: 'capa', amount: 1 },
    workSec: 4,
  },
  {
    id: 'botas',
    label: 'Botas de cuero',
    description: 'Calzado para caminar lejos.',
    inputs: [
      { id: 'cuero', amount: 2 },
      { id: 'fibra', amount: 2 },
    ],
    output: { id: 'botas', amount: 1 },
    workSec: 3,
  },
]

/** Which inventory items can be equipped, and to which slot. */
export const EQUIPABLE: Partial<Record<ResourceId, EquipSlot>> = {
  tunica: 'torso',
  pantalon: 'piernas',
  capa: 'capa',
  botas: 'pies',
  pala: 'mano',
  herramienta: 'mano',
}

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  refugio: {
    kind: 'refugio',
    label: 'Refugio de madera',
    description: 'Techo y paredes básicas para descansar.',
    cost: [
      { id: 'tablas', amount: 8 },
      { id: 'piedra', amount: 4 },
      { id: 'cuerda', amount: 2 },
    ],
    width: 3.2,
    depth: 3.2,
    height: 2.4,
    color: '#8B5A3C',
  },
  hoguera: {
    kind: 'hoguera',
    label: 'Hoguera',
    description: 'Fuego para cocinar y calor.',
    cost: [
      { id: 'piedra', amount: 4 },
      { id: 'lena', amount: 3 },
    ],
    width: 1.2,
    depth: 1.2,
    height: 0.6,
    color: '#5A4030',
  },
  almacen: {
    kind: 'almacen',
    label: 'Almacén',
    description: 'Guarda recursos secos bajo techo.',
    cost: [
      { id: 'tablas', amount: 6 },
      { id: 'ladrillo', amount: 4 },
      { id: 'clavo', amount: 4 },
    ],
    width: 2.8,
    depth: 2.4,
    height: 2.2,
    color: '#A07050',
  },
  tramo_calle: {
    kind: 'tramo_calle',
    label: 'Tramo de calle',
    description: 'Pavimento de concreto — primer paso a la ciudad.',
    cost: [{ id: 'concreto', amount: 4 }],
    width: 3,
    depth: 3,
    height: 0.12,
    color: '#8A8A88',
  },
}

export const WORLD = {
  /** ~5× previous playable span (was 280). */
  size: 1400,
  half: 700,
  rimPadding: 4,
  interactRange: 2.8,
  scanRange: 32,
  digRange: 2.4,
  floraCount: 780,
  faunaCount: 160,
  mineralCount: 220,
  lakeCount: 16,
  orchardCount: 8,
  lifeTickSec: 0.05,
} as const

export const NEEDS = {
  max: 100,
  /** Decay per second while exploring. */
  hungerDecay: 0.35,
  thirstDecay: 0.5,
  hygieneDecay: 0.18,
  /** How much consuming restores. */
  eatBerries: 18,
  eatCooked: 40,
  eatRawMeat: 22,
  drinkWater: 35,
  bathe: 50,
  soapBonus: 30,
  /** Vitality damage when a need hits 0. */
  starveDps: 4,
  dehydrateDps: 6,
} as const

export type LakeDef = {
  id: string
  x: number
  z: number
  radius: number
}
