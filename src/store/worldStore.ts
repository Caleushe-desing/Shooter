import { create } from 'zustand'
import type { Collider } from '../constants'
import {
  WORLD,
  FLORA,
  MINERALS,
  FAUNA,
  RECIPES,
  BUILDINGS,
  RESOURCE_LABELS,
  NEEDS,
  type ResourceId,
  type BuildingKind,
  type LakeDef,
} from '../world/catalog'
import {
  generateWorld,
  biomeAt,
  type FaunaInstance,
  type FloraInstance,
  type MineralInstance,
} from '../world/generate'

export type Inventory = Partial<Record<ResourceId, number>>

export type FloraState = FloraInstance & {
  hp: number
  harvested: boolean
  regenAt: number
  alive: boolean
}

export type MineralState = MineralInstance & {
  hp: number
  alive: boolean
  /** Revealed by ground scan. */
  revealed: boolean
}

export type FaunaState = FaunaInstance & {
  hp: number
  alive: boolean
  diedAt: number
}

export type BuildingState = {
  id: string
  kind: BuildingKind
  x: number
  z: number
  yaw: number
}

type Toast = { id: number; text: string }

type WorldStore = {
  ready: boolean
  flora: FloraState[]
  minerals: MineralState[]
  fauna: FaunaState[]
  lakes: LakeDef[]
  buildings: BuildingState[]
  inventory: Inventory
  inventoryOpen: boolean
  inventoryTab: 'mochila' | 'crafteo' | 'construir'
  toast: Toast | null
  interactHint: string | null
  scanActive: boolean
  scanPulseAt: number
  buildMode: BuildingKind | null
  initWorld: () => void
  getTreeColliders: () => Collider[]
  addLoot: (id: ResourceId, amount: number, label?: string) => void
  hasResources: (cost: { id: ResourceId; amount: number }[]) => boolean
  spendResources: (cost: { id: ResourceId; amount: number }[]) => boolean
  tryInteract: (px: number, pz: number) => boolean
  damageFlora: (id: string, amount?: number) => void
  damageMineral: (id: string, amount?: number) => void
  damageFauna: (id: string, amount?: number) => void
  setInteractHint: (hint: string | null) => void
  toggleInventory: () => void
  setInventoryOpen: (open: boolean) => void
  setInventoryTab: (tab: 'mochila' | 'crafteo' | 'construir') => void
  craft: (recipeId: string) => boolean
  consumeFood: (id: ResourceId) => { hunger: number; thirst: number; hygiene: number } | null
  gatherWater: (px: number, pz: number) => boolean
  bathe: (px: number, pz: number) => boolean
  fish: (px: number, pz: number) => boolean
  nearestLake: (px: number, pz: number) => LakeDef | null
  toggleScan: () => void
  performScan: (px: number, pz: number) => number
  setBuildMode: (kind: BuildingKind | null) => void
  placeBuilding: (kind: BuildingKind, x: number, z: number, yaw: number) => boolean
  tickRegen: (now: number) => void
  biomeLabelAt: (x: number, z: number) => string
}

let toastSeq = 0
let buildingSeq = 0
const generated = generateWorld()

function emptyInventory(): Inventory {
  // Starter pack so the pup can begin colonizing immediately.
  return {
    madera: 4,
    bayas: 3,
    agua: 2,
    fibra: 2,
  }
}

const BIOME_LABELS = {
  bosque: 'Bosque',
  pradera: 'Pradera',
  lago: 'Lago',
  rocoso: 'Cerros rocosos',
  humedal: 'Humedal',
} as const

export const useWorldStore = create<WorldStore>((set, get) => ({
  ready: false,
  flora: [],
  minerals: [],
  fauna: [],
  lakes: [],
  buildings: [],
  inventory: emptyInventory(),
  inventoryOpen: false,
  inventoryTab: 'mochila',
  toast: null,
  interactHint: null,
  scanActive: false,
  scanPulseAt: 0,
  buildMode: null,

  initWorld: () => {
    if (get().ready) return
    set({
      ready: true,
      lakes: generated.lakes,
      flora: generated.flora.map((f) => ({
        ...f,
        hp: FLORA[f.kind].hp,
        harvested: false,
        regenAt: 0,
        alive: true,
      })),
      minerals: generated.minerals.map((m) => ({
        ...m,
        hp: MINERALS[m.kind].hp,
        alive: true,
        revealed: !m.buried,
      })),
      fauna: generated.fauna.map((a) => ({
        ...a,
        hp: FAUNA[a.kind].hp,
        alive: true,
        diedAt: 0,
      })),
      inventory: emptyInventory(),
      buildings: [],
    })
  },

  getTreeColliders: () => {
    const list: Collider[] = []
    for (const f of get().flora) {
      if (!f.alive) continue
      const r = FLORA[f.kind].radius * f.scale
      list.push({ minX: f.x - r, maxX: f.x + r, minZ: f.z - r, maxZ: f.z + r })
    }
    for (const m of get().minerals) {
      if (!m.alive || !m.revealed) continue
      const r = MINERALS[m.kind].radius * m.scale
      list.push({ minX: m.x - r, maxX: m.x + r, minZ: m.z - r, maxZ: m.z + r })
    }
    for (const b of get().buildings) {
      if (b.kind === 'tramo_calle' || b.kind === 'hoguera') continue
      const def = BUILDINGS[b.kind]
      const hx = def.width * 0.45
      const hz = def.depth * 0.45
      list.push({ minX: b.x - hx, maxX: b.x + hx, minZ: b.z - hz, maxZ: b.z + hz })
    }
    const h = WORLD.half
    const t = 4
    list.push(
      { minX: -h - t, maxX: h + t, minZ: -h - t, maxZ: -h },
      { minX: -h - t, maxX: h + t, minZ: h, maxZ: h + t },
      { minX: -h - t, maxX: -h, minZ: -h, maxZ: h },
      { minX: h, maxX: h + t, minZ: -h, maxZ: h },
    )
    return list
  },

  addLoot: (id, amount, label) => {
    if (amount <= 0) return
    set((s) => ({
      inventory: {
        ...s.inventory,
        [id]: (s.inventory[id] ?? 0) + amount,
      },
      toast: {
        id: ++toastSeq,
        text: `+${amount} ${label ?? RESOURCE_LABELS[id]}`,
      },
    }))
  },

  hasResources: (cost) => {
    const inv = get().inventory
    return cost.every((c) => (inv[c.id] ?? 0) >= c.amount)
  },

  spendResources: (cost) => {
    if (!get().hasResources(cost)) return false
    set((s) => {
      const next = { ...s.inventory }
      for (const c of cost) {
        next[c.id] = (next[c.id] ?? 0) - c.amount
        if ((next[c.id] ?? 0) <= 0) delete next[c.id]
      }
      return { inventory: next }
    })
    return true
  },

  setInteractHint: (hint) => {
    if (get().interactHint === hint) return
    set({ interactHint: hint })
  },

  toggleInventory: () => set((s) => ({ inventoryOpen: !s.inventoryOpen, buildMode: null })),
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  setInventoryTab: (tab) => set({ inventoryTab: tab, inventoryOpen: true }),

  craft: (recipeId) => {
    const recipe = RECIPES.find((r) => r.id === recipeId)
    if (!recipe) return false
    if (!get().spendResources(recipe.inputs)) {
      set({
        toast: { id: ++toastSeq, text: 'Faltan materiales' },
      })
      return false
    }
    get().addLoot(recipe.output.id, recipe.output.amount)
    return true
  },

  consumeFood: (id) => {
    const inv = get().inventory
    if ((inv[id] ?? 0) < 1) return null
    get().spendResources([{ id, amount: 1 }])
    if (id === 'bayas') return { hunger: NEEDS.eatBerries, thirst: 8, hygiene: 0 }
    if (id === 'comida_cocida') return { hunger: NEEDS.eatCooked, thirst: 5, hygiene: 0 }
    if (id === 'carne' || id === 'pez') return { hunger: NEEDS.eatRawMeat, thirst: 0, hygiene: -5 }
    if (id === 'agua') return { hunger: 0, thirst: NEEDS.drinkWater, hygiene: 0 }
    if (id === 'jabon') return { hunger: 0, thirst: 0, hygiene: NEEDS.soapBonus }
    return { hunger: 10, thirst: 0, hygiene: 0 }
  },

  nearestLake: (px, pz) => {
    let best: LakeDef | null = null
    let bestD = Infinity
    for (const lake of get().lakes) {
      const d = Math.hypot(lake.x - px, lake.z - pz) - lake.radius
      if (d < bestD) {
        bestD = d
        best = lake
      }
    }
    return bestD <= WORLD.interactRange ? best : null
  },

  gatherWater: (px, pz) => {
    if (!get().nearestLake(px, pz)) return false
    get().addLoot('agua', 2)
    return true
  },

  bathe: (px, pz) => {
    if (!get().nearestLake(px, pz)) return false
    set({ toast: { id: ++toastSeq, text: 'Te duchaste en el lago' } })
    return true
  },

  fish: (px, pz) => {
    if (!get().nearestLake(px, pz)) return false
    if (Math.random() < 0.55) {
      get().addLoot('pez', 1)
      return true
    }
    set({ toast: { id: ++toastSeq, text: 'No picó…' } })
    return true
  },

  toggleScan: () => {
    const next = !get().scanActive
    set({ scanActive: next, toast: { id: ++toastSeq, text: next ? 'Escáner de suelo ON' : 'Escáner OFF' } })
  },

  performScan: (px, pz) => {
    const range = WORLD.scanRange
    let found = 0
    set((s) => ({
      scanPulseAt: performance.now(),
      minerals: s.minerals.map((m) => {
        if (!m.alive || m.revealed) return m
        if (Math.hypot(m.x - px, m.z - pz) <= range) {
          found++
          return { ...m, revealed: true, buried: false }
        }
        return m
      }),
    }))
    set({
      toast: {
        id: ++toastSeq,
        text: found > 0 ? `Escaneo: ${found} depósitos revelados` : 'Escaneo: nada nuevo cerca',
      },
    })
    return found
  },

  setBuildMode: (kind) => set({ buildMode: kind, inventoryOpen: kind ? false : get().inventoryOpen }),

  placeBuilding: (kind, x, z, yaw) => {
    const def = BUILDINGS[kind]
    if (!get().spendResources(def.cost)) {
      set({ toast: { id: ++toastSeq, text: `Faltan materiales para ${def.label}` } })
      return false
    }
    const id = `build-${++buildingSeq}`
    set((s) => ({
      buildings: [...s.buildings, { id, kind, x, z, yaw }],
      buildMode: null,
      toast: { id: ++toastSeq, text: `Construido: ${def.label}` },
    }))
    return true
  },

  tryInteract: (px, pz) => {
    const range: number = WORLD.interactRange
    const now = performance.now()

    // Prefer lake actions when standing in water edge.
    if (get().nearestLake(px, pz)) {
      get().gatherWater(px, pz)
      return true
    }

    const flora = get().flora
    let bestFlora: FloraState | null = null
    let bestFd = range
    for (const f of flora) {
      if (!f.alive || f.harvested) continue
      const d = Math.hypot(f.x - px, f.z - pz)
      if (d < bestFd) {
        bestFd = d
        bestFlora = f
      }
    }
    if (bestFlora) {
      const def = FLORA[bestFlora.kind]
      get().addLoot(def.harvest, def.harvestAmount, RESOURCE_LABELS[def.harvest])
      set((s) => ({
        flora: s.flora.map((f) =>
          f.id === bestFlora!.id
            ? {
                ...f,
                harvested: true,
                regenAt: def.regenSec > 0 ? now + def.regenSec * 1000 : 0,
                alive: def.woodOnFell > 0 ? f.alive : def.regenSec > 0,
                hp: def.woodOnFell > 0 ? f.hp : 0,
              }
            : f,
        ),
      }))
      // Bushes with no wood simply despawn until regen; trees stay for chopping via tool/shot.
      if (def.woodOnFell === 0 && def.regenSec === 0) {
        set((s) => ({
          flora: s.flora.map((f) => (f.id === bestFlora!.id ? { ...f, alive: false } : f)),
        }))
      }
      return true
    }

    const minerals = get().minerals
    let bestMin: MineralState | null = null
    let bestMd = range
    for (const m of minerals) {
      if (!m.alive || !m.revealed) continue
      const d = Math.hypot(m.x - px, m.z - pz)
      if (d < bestMd) {
        bestMd = d
        bestMin = m
      }
    }
    if (bestMin) {
      get().damageMineral(bestMin.id, 1)
      return true
    }
    return false
  },

  damageFlora: (id, amount = 1) => {
    const f = get().flora.find((x) => x.id === id)
    if (!f || !f.alive) return
    const def = FLORA[f.kind]
    const hp = f.hp - amount
    if (hp > 0) {
      set((s) => ({ flora: s.flora.map((x) => (x.id === id ? { ...x, hp } : x)) }))
      return
    }
    if (def.woodOnFell > 0) get().addLoot('madera', def.woodOnFell)
    if (!f.harvested) get().addLoot(def.harvest, def.harvestAmount)
    set((s) => ({
      flora: s.flora.map((x) => (x.id === id ? { ...x, hp: 0, alive: false, harvested: true } : x)),
    }))
  },

  damageMineral: (id, amount = 1) => {
    const m = get().minerals.find((x) => x.id === id)
    if (!m || !m.alive || !m.revealed) return
    const def = MINERALS[m.kind]
    const hp = m.hp - amount
    if (hp > 0) {
      set((s) => ({ minerals: s.minerals.map((x) => (x.id === id ? { ...x, hp } : x)) }))
      get().addLoot(def.yield, 1)
      return
    }
    get().addLoot(def.yield, def.yieldAmount)
    set((s) => ({
      minerals: s.minerals.map((x) => (x.id === id ? { ...x, hp: 0, alive: false } : x)),
    }))
  },

  damageFauna: (id, amount = 1) => {
    const a = get().fauna.find((x) => x.id === id)
    if (!a || !a.alive) return
    const def = FAUNA[a.kind]
    const hp = a.hp - amount
    if (hp > 0) {
      set((s) => ({ fauna: s.fauna.map((x) => (x.id === id ? { ...x, hp } : x)) }))
      return
    }
    for (const loot of def.loot) {
      if (loot.amount > 0) get().addLoot(loot.id, loot.amount)
    }
    set((s) => ({
      fauna: s.fauna.map((x) =>
        x.id === id ? { ...x, hp: 0, alive: false, diedAt: performance.now() } : x,
      ),
    }))
  },

  tickRegen: (now) => {
    const flora = get().flora
    let dirty = false
    const next = flora.map((f) => {
      if (!f.harvested || f.regenAt <= 0 || now < f.regenAt) return f
      dirty = true
      return { ...f, harvested: false, regenAt: 0, hp: FLORA[f.kind].hp, alive: true }
    })
    if (dirty) set({ flora: next })
  },

  biomeLabelAt: (x, z) => BIOME_LABELS[biomeAt(x, z, get().lakes)],
}))
