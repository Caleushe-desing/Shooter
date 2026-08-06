import { create } from 'zustand'
import type { Collider } from '../constants'
import { WORLD, FLORA, MINERALS, FAUNA, RESOURCE_LABELS, type ResourceId } from '../world/catalog'
import {
  generateWorld,
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
}

export type FaunaState = FaunaInstance & {
  hp: number
  alive: boolean
  diedAt: number
}

type Toast = { id: number; text: string }

type WorldStore = {
  ready: boolean
  flora: FloraState[]
  minerals: MineralState[]
  fauna: FaunaState[]
  inventory: Inventory
  toast: Toast | null
  interactHint: string | null
  initWorld: () => void
  getTreeColliders: () => Collider[]
  addLoot: (id: ResourceId, amount: number, label?: string) => void
  tryInteract: (px: number, pz: number) => boolean
  damageFlora: (id: string, amount?: number) => void
  damageMineral: (id: string, amount?: number) => void
  damageFauna: (id: string, amount?: number) => void
  setInteractHint: (hint: string | null) => void
  tickRegen: (now: number) => void
}

let toastSeq = 0
const generated = generateWorld()

function emptyInventory(): Inventory {
  return {}
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  ready: false,
  flora: [],
  minerals: [],
  fauna: [],
  inventory: emptyInventory(),
  toast: null,
  interactHint: null,

  initWorld: () => {
    if (get().ready) return
    set({
      ready: true,
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
      })),
      fauna: generated.fauna.map((a) => ({
        ...a,
        hp: FAUNA[a.kind].hp,
        alive: true,
        diedAt: 0,
      })),
      inventory: emptyInventory(),
    })
  },

  getTreeColliders: () => {
    const list: Collider[] = []
    for (const f of get().flora) {
      if (!f.alive) continue
      const r = FLORA[f.kind].radius * f.scale
      list.push({
        minX: f.x - r,
        maxX: f.x + r,
        minZ: f.z - r,
        maxZ: f.z + r,
      })
    }
    for (const m of get().minerals) {
      if (!m.alive) continue
      const r = MINERALS[m.kind].radius * m.scale
      list.push({
        minX: m.x - r,
        maxX: m.x + r,
        minZ: m.z - r,
        maxZ: m.z + r,
      })
    }
    // Soft world rim.
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

  setInteractHint: (hint) => {
    if (get().interactHint === hint) return
    set({ interactHint: hint })
  },

  tryInteract: (px, pz) => {
    const range: number = WORLD.interactRange
    const now = performance.now()
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
              }
            : f,
        ),
      }))
      return true
    }

    const minerals = get().minerals
    let bestMin: MineralState | null = null
    let bestMd = range
    for (const m of minerals) {
      if (!m.alive) continue
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
      set((s) => ({
        flora: s.flora.map((x) => (x.id === id ? { ...x, hp } : x)),
      }))
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
    if (!m || !m.alive) return
    const def = MINERALS[m.kind]
    const hp = m.hp - amount
    if (hp > 0) {
      set((s) => ({
        minerals: s.minerals.map((x) => (x.id === id ? { ...x, hp } : x)),
      }))
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
      set((s) => ({
        fauna: s.fauna.map((x) => (x.id === id ? { ...x, hp } : x)),
      }))
      return
    }
    for (const loot of def.loot) get().addLoot(loot.id, loot.amount)
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
      if (!f.alive || !f.harvested || f.regenAt <= 0 || now < f.regenAt) return f
      dirty = true
      return { ...f, harvested: false, regenAt: 0, hp: FLORA[f.kind].hp }
    })
    if (dirty) set({ flora: next })
  },
}))
