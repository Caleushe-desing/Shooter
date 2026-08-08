/** Shared hangar / enclosure dimensions. */
export const HANGAR = {
  /** Center Y of the ceiling slab. */
  ceilingY: 22,
  /** Ceiling slab thickness. */
  thickness: 0.55,
} as const

/** Top face of the ceiling slab. */
export const HANGAR_TOP = HANGAR.ceilingY + HANGAR.thickness * 0.5
