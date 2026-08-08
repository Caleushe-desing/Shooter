import * as THREE from 'three'

/**
 * Classic cartoon ghost silhouette (dome head + wavy skirt),
 * built as a lathed body with scalloped bottom flaps.
 */
export function createGhostBodyGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = []
  const domeH = height * 0.42
  const bodyTop = height * 0.55
  const skirtY = height * 0.12

  // Tip of the head → dome → body → taper into skirt
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const angle = (Math.PI / 2) * t
    const x = Math.sin(angle) * radius * 0.95
    const y = height - (1 - Math.cos(angle)) * domeH
    profile.push(new THREE.Vector2(Math.max(0.02, x), y))
  }
  profile.push(new THREE.Vector2(radius, bodyTop))
  profile.push(new THREE.Vector2(radius * 1.02, height * 0.28))
  profile.push(new THREE.Vector2(radius * 0.92, skirtY))

  const lathe = new THREE.LatheGeometry(profile, 20)
  lathe.computeVertexNormals()

  const flaps = 5
  const flapGeos: THREE.BufferGeometry[] = [lathe]
  for (let i = 0; i < flaps; i++) {
    const a = (i / flaps) * Math.PI * 2
    const fx = Math.cos(a) * radius * 0.55
    const fz = Math.sin(a) * radius * 0.55
    const flap = new THREE.SphereGeometry(radius * 0.38, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)
    flap.scale(1, 1.15, 1)
    flap.translate(fx, skirtY * 0.55, fz)
    flapGeos.push(flap)
  }

  const merged = mergeGeometries(flapGeos)
  for (const g of flapGeos) g.dispose()
  return merged
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let indexOffset = 0

  for (const geo of geometries) {
    const pos = geo.getAttribute('position')
    const nrm = geo.getAttribute('normal')
    const uv = geo.getAttribute('uv')
    const idx = geo.getIndex()
    if (!pos) continue

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      if (nrm) normals.push(nrm.getX(i), nrm.getY(i), nrm.getZ(i))
      else normals.push(0, 1, 0)
      if (uv) uvs.push(uv.getX(i), uv.getY(i))
      else uvs.push(0, 0)
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + indexOffset)
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(i + indexOffset)
    }
    indexOffset += pos.count
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  merged.setIndex(indices)
  merged.computeVertexNormals()
  return merged
}
