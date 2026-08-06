import { useEffect, useState } from 'react'
import { RESOURCE_LABELS, type ResourceId } from '../../world/catalog'
import { useWorldStore } from '../../store/worldStore'
import { getPlayerPosition } from '../../store/enemyRuntime'

const ORDER: ResourceId[] = [
  'maqui',
  'pinon',
  'copihue',
  'fruta_quillay',
  'hoja_boldo',
  'madera',
  'carne',
  'lana',
  'cuero',
  'cobre',
  'litio',
  'oro',
  'salitre',
  'piedra',
]

/** Inventory + toast + interact prompt for the open Chilean world. */
export function InventoryHUD() {
  const inventory = useWorldStore((s) => s.inventory)
  const toast = useWorldStore((s) => s.toast)
  const hint = useWorldStore((s) => s.interactHint)
  const [open, setOpen] = useState(false)
  const [toastText, setToastText] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    setToastText(toast.text)
    const id = window.setTimeout(() => setToastText(null), 1600)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyI') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const entries = ORDER.map((id) => ({ id, amount: inventory[id] ?? 0 })).filter((e) => e.amount > 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-4 top-14 z-40 rounded-full border border-white/20 bg-[#1A2430]/75 px-3 py-1.5 text-[9px] font-bold tracking-[0.22em] text-[#6FE04A] backdrop-blur-md sm:top-16"
      >
        MOCHILA · I
      </button>

      {hint && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1A2430]/8 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-[#6FE04A] sm:bottom-20">
          {hint}
        </div>
      )}

      {toastText && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-40 -translate-x-1/2 rounded-full bg-[#6FE04A] px-4 py-2 text-sm font-extrabold tracking-wide text-[#1A2430]">
          {toastText}
        </div>
      )}

      <button
        type="button"
        aria-label="Recolectar"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const p = getPlayerPosition()
          useWorldStore.getState().tryInteract(p.x, p.z)
        }}
        className="absolute bottom-28 left-4 z-40 rounded-full border border-white/20 bg-[#1A2430]/8 px-4 py-3 text-[10px] font-bold tracking-[0.28em] text-[#6FE04A] backdrop-blur-md sm:hidden"
      >
        RECOGER
      </button>

      {open && (
        <div className="absolute bottom-20 left-4 z-40 w-56 rounded-2xl border border-white/20 bg-[#1A2430]/88 p-3 backdrop-blur-md sm:bottom-16 sm:w-64">
          <div className="mb-2 text-[10px] font-bold tracking-[0.25em] text-white/60">
            INVENTARIO CHILE
          </div>
          {entries.length === 0 ? (
            <p className="text-xs text-white/50">Vacío — recolecta con E / dispara fauna</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
              {entries.map((e) => (
                <li key={e.id} className="flex justify-between gap-2 text-white/90">
                  <span>{RESOURCE_LABELS[e.id]}</span>
                  <span className="font-extrabold text-[#6FE04A]">{e.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}
