/** Live world positions for plates (updated each frame by Plates meshes). */
const livePlatePositions = new Map<string, [number, number, number]>()

export function setLivePlatePosition(id: string, x: number, y: number, z: number) {
  livePlatePositions.set(id, [x, y, z])
}

export function clearLivePlatePosition(id: string) {
  livePlatePositions.delete(id)
}

export function getLivePlatePosition(id: string): [number, number, number] | undefined {
  return livePlatePositions.get(id)
}

export function clearAllLivePlates() {
  livePlatePositions.clear()
}
