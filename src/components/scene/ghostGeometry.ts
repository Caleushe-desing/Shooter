import * as THREE from 'three'

/**
 * Classic cartoon ghost: dome head + vertical body + scalloped skirt.
 * Extruded silhouette so the ghost shape reads from the front and sides.
 */
export function createGhostBodyGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
  const hw = radius * 1.05
  const skirtTop = height * 0.32
  const domeR = hw
  const domeCy = height - domeR
  const waves = 4

  const shape = new THREE.Shape()
  // Left body up to dome
  shape.moveTo(-hw, skirtTop)
  shape.lineTo(-hw, domeCy)
  // Domed head (left → right)
  shape.absarc(0, domeCy, domeR, Math.PI, 0, false)
  // Right body down to skirt
  shape.lineTo(hw, skirtTop)

  // Scalloped bottom (right → left)
  for (let i = 0; i < waves; i++) {
    const x1 = hw - ((i + 0.5) / waves) * 2 * hw
    const x2 = hw - ((i + 1) / waves) * 2 * hw
    shape.quadraticCurveTo(x1, height * 0.02, x2, skirtTop)
  }
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: radius * 0.85,
    bevelEnabled: true,
    bevelThickness: radius * 0.12,
    bevelSize: radius * 0.1,
    bevelSegments: 2,
    curveSegments: 20,
  })
  geo.translate(0, 0, (-radius * 0.85) / 2)
  geo.computeVertexNormals()
  return geo
}
