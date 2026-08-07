import { useMemo, useState } from 'react'
import {
  RESOURCE_LABELS,
  RESOURCE_CATEGORY,
  RECIPES,
  BUILDINGS,
  type ResourceId,
  type BuildingKind,
} from '../../world/catalog'
import { getResourceIconUrl } from '../../world/resourceIcons'
import { useWorldStore } from '../../store/worldStore'
import { useGameStore } from '../../store/gameStore'

const TABS = [
  { id: 'mochila' as const, label: 'Mochila' },
  { id: 'crafteo' as const, label: 'Crafteo' },
  { id: 'construir' as const, label: 'Construir' },
]

const EDIBLE: ResourceId[] = ['bayas', 'carne', 'pez', 'comida_cocida', 'agua', 'jabon']

export function InventoryHUD() {
  const inventory = useWorldStore((s) => s.inventory)
  const open = useWorldStore((s) => s.inventoryOpen)
  const tab = useWorldStore((s) => s.inventoryTab)
  const toggle = useWorldStore((s) => s.toggleInventory)
  const setTab = useWorldStore((s) => s.setInventoryTab)
  const craft = useWorldStore((s) => s.craft)
  const hasResources = useWorldStore((s) => s.hasResources)
  const setBuildMode = useWorldStore((s) => s.setBuildMode)
  const buildMode = useWorldStore((s) => s.buildMode)
  const hint = useWorldStore((s) => s.interactHint)
  const toast = useWorldStore((s) => s.toast)
  const consumeFood = useWorldStore((s) => s.consumeFood)
  const applyNeeds = useGameStore((s) => s.applyNeeds)
  const [filter, setFilter] = useState<'todos' | 'comida' | 'natural' | 'mineral' | 'crafteado'>('todos')

  const rows = useMemo(() => {
    return (Object.keys(RESOURCE_LABELS) as ResourceId[])
      .map((id) => ({
        id,
        count: inventory[id] ?? 0,
        label: RESOURCE_LABELS[id],
        icon: getResourceIconUrl(id),
        category: RESOURCE_CATEGORY[id],
      }))
      .filter((row) => row.count > 0)
      .filter((row) => filter === 'todos' || row.category === filter)
      .sort((a, b) => b.count - a.count)
  }, [inventory, filter])

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-none absolute top-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-emerald-300/30 bg-black/60 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg backdrop-blur-md"
        >
          {toast.text}
        </div>
      )}

      {hint && !open && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 z-20 -translate-x-1/2 rounded-full border border-amber-200/30 bg-black/55 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-amber-50 shadow-lg backdrop-blur-md sm:bottom-20">
          {hint}
        </div>
      )}

      {buildMode && !open && (
        <div className="pointer-events-none absolute top-28 left-1/2 z-20 -translate-x-1/2 rounded-full border border-sky-300/40 bg-black/60 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-sky-100">
          Construir {BUILDINGS[buildMode].label} · click izq / F para colocar · Esc cancela
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto absolute bottom-24 left-3 z-20 rounded-full border border-amber-200/35 bg-black/55 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-50 shadow-lg backdrop-blur-md sm:bottom-6"
        >
          Mochila · I
        </button>
      ) : (
        <div className="pointer-events-auto absolute inset-x-3 bottom-20 z-30 mx-auto flex max-h-[70vh] w-full max-w-lg flex-col rounded-2xl border border-amber-200/30 bg-[#1a120c]/94 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:inset-x-auto sm:left-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                Colono
              </p>
              <h2 className="font-display text-xl text-amber-50">Mochila & taller</h2>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wider text-white/80"
            >
              Cerrar
            </button>
          </div>

          <div className="mb-3 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  tab === t.id
                    ? 'bg-amber-500/90 text-[#1a120c]'
                    : 'border border-white/15 text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'mochila' && (
            <>
              <div className="mb-2 flex flex-wrap gap-1">
                {(['todos', 'comida', 'natural', 'mineral', 'crafteado'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      filter === f ? 'bg-white/20 text-white' : 'text-white/45'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-white/65">Vacía. Recolecta en el valle.</p>
              ) : (
                <ul className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-1 rounded-xl border border-white/10 bg-black/35 px-2 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={row.icon}
                          alt={row.label}
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-contain"
                          draggable={false}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-amber-50">{row.label}</p>
                          <p className="text-[10px] uppercase tracking-wider text-white/45">
                            ×{row.count}
                          </p>
                        </div>
                      </div>
                      {EDIBLE.includes(row.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            const delta = consumeFood(row.id)
                            if (delta) applyNeeds(delta)
                          }}
                          className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100"
                        >
                          Usar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === 'crafteo' && (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {RECIPES.map((recipe) => {
                const can = hasResources(recipe.inputs)
                return (
                  <li
                    key={recipe.id}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <img
                            src={getResourceIconUrl(recipe.output.id)}
                            alt=""
                            className="h-8 w-8 rounded-md"
                          />
                          <div>
                            <p className="text-sm font-semibold text-amber-50">{recipe.label}</p>
                            <p className="text-[11px] text-white/50">{recipe.description}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-white/60">
                          {recipe.inputs
                            .map((i) => `${RESOURCE_LABELS[i.id]} ×${i.amount}`)
                            .join(' + ')}{' '}
                          → {RESOURCE_LABELS[recipe.output.id]} ×{recipe.output.amount}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!can}
                        onClick={() => craft(recipe.id)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          can
                            ? 'bg-amber-500 text-[#1a120c]'
                            : 'cursor-not-allowed border border-white/10 text-white/35'
                        }`}
                      >
                        Crear
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {tab === 'construir' && (
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {(Object.keys(BUILDINGS) as BuildingKind[]).map((kind) => {
                const def = BUILDINGS[kind]
                const can = hasResources(def.cost)
                return (
                  <li
                    key={kind}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-amber-50">{def.label}</p>
                        <p className="text-[11px] text-white/50">{def.description}</p>
                        <p className="mt-1 text-[11px] text-white/60">
                          {def.cost
                            .map((c) => `${RESOURCE_LABELS[c.id]} ×${c.amount}`)
                            .join(' + ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!can}
                        onClick={() => setBuildMode(kind)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          can
                            ? 'bg-sky-400 text-[#102030]'
                            : 'cursor-not-allowed border border-white/10 text-white/35'
                        }`}
                      >
                        Colocar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
