import { useMemo, useState } from 'react'
import {
  RESOURCE_LABELS,
  RESOURCE_CATEGORY,
  RECIPES,
  BUILDINGS,
  EQUIPABLE,
  type ResourceId,
  type BuildingKind,
  type EquipSlot,
  type ResourceCategory,
} from '../../world/catalog'
import { getResourceIconUrl } from '../../world/resourceIcons'
import { useWorldStore } from '../../store/worldStore'
import { useGameStore } from '../../store/gameStore'

const TABS = [
  { id: 'mochila' as const, label: 'Inventario' },
  { id: 'crafteo' as const, label: 'Crafteo' },
  { id: 'equipo' as const, label: 'Equipo' },
  { id: 'construir' as const, label: 'Construir' },
]

const EDIBLE: ResourceId[] = ['bayas', 'carne', 'pez', 'comida_cocida', 'agua', 'jabon']

const SLOT_LABELS: Record<EquipSlot, string> = {
  torso: 'Torso',
  piernas: 'Piernas',
  capa: 'Capa',
  pies: 'Pies',
  mano: 'Mano',
}

/** Fullscreen ARK-style inventory / crafting — touch + mouse friendly. */
export function InventoryHUD() {
  const inventory = useWorldStore((s) => s.inventory)
  const equipped = useWorldStore((s) => s.equipped)
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
  const equipItem = useWorldStore((s) => s.equipItem)
  const unequipSlot = useWorldStore((s) => s.unequipSlot)
  const applyNeeds = useGameStore((s) => s.applyNeeds)
  const [filter, setFilter] = useState<'todos' | ResourceCategory>('todos')
  const [craftFilter, setCraftFilter] = useState<'todos' | 'materiales' | 'ropa' | 'herramientas' | 'comida'>(
    'todos',
  )

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

  const recipes = useMemo(() => {
    return RECIPES.filter((r) => {
      if (craftFilter === 'todos') return true
      const cat = RESOURCE_CATEGORY[r.output.id]
      if (craftFilter === 'ropa') return cat === 'ropa'
      if (craftFilter === 'herramientas') return cat === 'herramienta'
      if (craftFilter === 'comida') return cat === 'comida'
      return cat === 'crafteado' || cat === 'natural'
    })
  }, [craftFilter])

  return (
    <>
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-none absolute top-20 left-1/2 z-50 -translate-x-1/2 rounded-md border border-emerald-400/25 bg-black/75 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-xl"
        >
          {toast.text}
        </div>
      )}

      {hint && !open && (
        <div className="pointer-events-none absolute bottom-36 left-1/2 z-20 -translate-x-1/2 rounded-md border border-white/15 bg-black/60 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] text-white/90 sm:bottom-20">
          {hint}
        </div>
      )}

      {buildMode && !open && (
        <div className="pointer-events-none absolute top-28 left-1/2 z-20 -translate-x-1/2 rounded-md border border-sky-300/30 bg-black/70 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-sky-100">
          Construir {BUILDINGS[buildMode].label} · F / click · Esc cancela
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto absolute bottom-24 left-3 z-20 rounded-md border border-white/20 bg-black/65 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg sm:bottom-6"
        >
          Inventario · I
        </button>
      )}

      {open && (
        <div
          className="pointer-events-auto fixed inset-0 z-[200] flex h-[100dvh] w-screen flex-col bg-[#0c1014]"
          role="dialog"
          aria-modal="true"
          aria-label="Inventario del colono"
        >
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                Supervivencia
              </p>
              <h2 className="text-xl font-bold tracking-wide text-[#d8c8a8] sm:text-2xl">
                Inventario del colono
              </h2>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="min-h-11 min-w-11 rounded-md border border-white/20 bg-white/5 px-4 text-sm font-bold uppercase tracking-wider text-white active:bg-white/15"
            >
              Cerrar · Esc
            </button>
          </div>

          {/* Tabs — large touch targets */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 sm:px-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-bold uppercase tracking-wider ${
                  tab === t.id
                    ? 'bg-[#8a6a3a] text-[#1a1208]'
                    : 'border border-white/15 text-white/70 active:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
            {tab === 'mochila' && (
              <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_240px]">
                <div>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {(
                      ['todos', 'comida', 'natural', 'mineral', 'crafteado', 'ropa', 'herramienta'] as const
                    ).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`min-h-9 rounded-md px-3 text-[11px] font-bold uppercase tracking-wider ${
                          filter === f ? 'bg-white/20 text-white' : 'text-white/45'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-white/55">Inventario vacío.</p>
                  ) : (
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                      {rows.map((row) => (
                        <li
                          key={row.id}
                          className="flex flex-col rounded-md border border-white/10 bg-black/40 p-2"
                        >
                          <button
                            type="button"
                            className="flex flex-col items-center gap-1 text-center"
                            onClick={() => {
                              if (EQUIPABLE[row.id]) equipItem(row.id)
                            }}
                          >
                            <img
                              src={row.icon}
                              alt={row.label}
                              className="h-14 w-14 rounded-md border border-white/10 object-contain sm:h-16 sm:w-16"
                              draggable={false}
                            />
                            <span className="line-clamp-2 text-xs font-semibold text-[#e8dcc4]">
                              {row.label}
                            </span>
                            <span className="text-[11px] text-white/50">×{row.count}</span>
                          </button>
                          <div className="mt-1 flex flex-col gap-1">
                            {EDIBLE.includes(row.id) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const delta = consumeFood(row.id)
                                  if (delta) applyNeeds(delta)
                                }}
                                className="min-h-9 rounded-md bg-emerald-700/80 text-[11px] font-bold uppercase tracking-wider text-white"
                              >
                                Usar
                              </button>
                            )}
                            {EQUIPABLE[row.id] && (
                              <button
                                type="button"
                                onClick={() => equipItem(row.id)}
                                className="min-h-9 rounded-md bg-[#6a5a3a] text-[11px] font-bold uppercase tracking-wider text-white"
                              >
                                Equipar
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <aside className="rounded-md border border-white/10 bg-black/35 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Equipo rápido
                  </p>
                  <ul className="space-y-2">
                    {(Object.keys(SLOT_LABELS) as EquipSlot[]).map((slot) => {
                      const id = equipped[slot]
                      return (
                        <li
                          key={slot}
                          className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 p-2"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-white/20 bg-black/40">
                            {id ? (
                              <img src={getResourceIconUrl(id)} alt="" className="h-10 w-10" />
                            ) : (
                              <span className="text-[9px] text-white/30">vacío</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-white/40">
                              {SLOT_LABELS[slot]}
                            </p>
                            <p className="truncate text-sm text-[#e8dcc4]">
                              {id ? RESOURCE_LABELS[id] : '—'}
                            </p>
                          </div>
                          {id && (
                            <button
                              type="button"
                              onClick={() => unequipSlot(slot)}
                              className="min-h-9 rounded-md border border-white/15 px-2 text-[10px] font-bold uppercase text-white/70"
                            >
                              Quitar
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </aside>
              </div>
            )}

            {tab === 'crafteo' && (
              <div className="mx-auto max-w-4xl">
                <div className="mb-3 flex flex-wrap gap-1">
                  {(
                    [
                      ['todos', 'Todos'],
                      ['materiales', 'Materiales'],
                      ['ropa', 'Ropa'],
                      ['herramientas', 'Herramientas'],
                      ['comida', 'Comida'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCraftFilter(id)}
                      className={`min-h-9 rounded-md px-3 text-[11px] font-bold uppercase tracking-wider ${
                        craftFilter === id ? 'bg-[#8a6a3a] text-[#1a1208]' : 'text-white/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ul className="space-y-2">
                  {recipes.map((recipe) => {
                    const can = hasResources(recipe.inputs)
                    return (
                      <li
                        key={recipe.id}
                        className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <img
                            src={getResourceIconUrl(recipe.output.id)}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-md border border-white/10"
                          />
                          <div>
                            <p className="text-base font-bold text-[#e8dcc4]">{recipe.label}</p>
                            <p className="text-sm text-white/50">{recipe.description}</p>
                            <p className="mt-1 text-xs text-white/60">
                              {recipe.inputs
                                .map((i) => `${RESOURCE_LABELS[i.id]} ×${i.amount}`)
                                .join(' + ')}{' '}
                              → {RESOURCE_LABELS[recipe.output.id]} ×{recipe.output.amount}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!can}
                          onClick={() => craft(recipe.id)}
                          className={`min-h-12 shrink-0 rounded-md px-5 text-sm font-bold uppercase tracking-wider ${
                            can
                              ? 'bg-[#8a6a3a] text-[#1a1208] active:scale-[0.98]'
                              : 'cursor-not-allowed border border-white/10 text-white/30'
                          }`}
                        >
                          Crear
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {tab === 'equipo' && (
              <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
                {(Object.keys(SLOT_LABELS) as EquipSlot[]).map((slot) => {
                  const id = equipped[slot]
                  return (
                    <div
                      key={slot}
                      className="rounded-md border border-white/10 bg-black/40 p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                        {SLOT_LABELS[slot]}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-white/25 bg-black/40">
                          {id ? (
                            <img src={getResourceIconUrl(id)} alt="" className="h-16 w-16" />
                          ) : (
                            <span className="text-xs text-white/30">vacío</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-[#e8dcc4]">
                            {id ? RESOURCE_LABELS[id] : 'Sin equipo'}
                          </p>
                          {id ? (
                            <button
                              type="button"
                              onClick={() => unequipSlot(slot)}
                              className="mt-2 min-h-11 rounded-md border border-white/20 px-3 text-xs font-bold uppercase text-white/80"
                            >
                              Desequipar
                            </button>
                          ) : (
                            <p className="mt-1 text-sm text-white/40">
                              Craftea ropa o pala y equípalas desde Inventario.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'construir' && (
              <ul className="mx-auto max-w-3xl space-y-2">
                {(Object.keys(BUILDINGS) as BuildingKind[]).map((kind) => {
                  const def = BUILDINGS[kind]
                  const can = hasResources(def.cost)
                  return (
                    <li
                      key={kind}
                      className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-base font-bold text-[#e8dcc4]">{def.label}</p>
                        <p className="text-sm text-white/50">{def.description}</p>
                        <p className="mt-1 text-xs text-white/60">
                          {def.cost.map((c) => `${RESOURCE_LABELS[c.id]} ×${c.amount}`).join(' + ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!can}
                        onClick={() => setBuildMode(kind)}
                        className={`min-h-12 shrink-0 rounded-md px-5 text-sm font-bold uppercase tracking-wider ${
                          can
                            ? 'bg-sky-700 text-white active:scale-[0.98]'
                            : 'cursor-not-allowed border border-white/10 text-white/30'
                        }`}
                      >
                        Colocar
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
