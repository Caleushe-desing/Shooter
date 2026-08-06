import { useMemo } from 'react'
import { RESOURCE_LABELS, type ResourceId } from '../../world/catalog'
import { getResourceIconUrl } from '../../world/resourceIcons'
import { useWorldStore } from '../../store/worldStore'

export function InventoryHUD() {
  const inventory = useWorldStore((s) => s.inventory)
  const open = useWorldStore((s) => s.inventoryOpen)
  const toggle = useWorldStore((s) => s.toggleInventory)
  const hint = useWorldStore((s) => s.interactHint)
  const toast = useWorldStore((s) => s.toast)

  const rows = useMemo(() => {
    return (Object.keys(RESOURCE_LABELS) as ResourceId[])
      .map((id) => ({
        id,
        count: inventory[id] ?? 0,
        label: RESOURCE_LABELS[id],
        icon: getResourceIconUrl(id),
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [inventory])

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

      {!open ? (
        <button
          type="button"
          onClick={toggle}
          className="pointer-events-auto absolute bottom-24 left-3 z-20 rounded-full border border-amber-200/35 bg-black/55 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-50 shadow-lg backdrop-blur-md sm:bottom-6"
        >
          Mochila · I
        </button>
      ) : (
        <div className="pointer-events-auto absolute inset-x-3 bottom-24 z-30 mx-auto max-w-md rounded-2xl border border-amber-200/30 bg-[#1a120c]/92 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:inset-x-auto sm:left-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
                Inventario
              </p>
              <h2 className="font-display text-xl text-amber-50">Mochila chilena</h2>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wider text-white/80"
            >
              Cerrar
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-white/65">
              Vacía. Tala, minera o caza en el valle para llenarla.
            </p>
          ) : (
            <ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-2 py-2"
                >
                  <img
                    src={row.icon}
                    alt={row.label}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-black/40 object-contain"
                    draggable={false}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-amber-50">{row.label}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/45">
                      ×{row.count}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
