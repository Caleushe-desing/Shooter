/**
 * Mobile look stick — written by touch UI, read by PlayerController.
 * Avoids 60fps Zustand updates that can thrash React / animation effects.
 */
export const mobileLookStick = {
  active: false,
  /** Normalized aim bias after deadzone, roughly -1…1. */
  x: 0,
  y: 0,
}

export function resetMobileLookStick() {
  mobileLookStick.active = false
  mobileLookStick.x = 0
  mobileLookStick.y = 0
}
