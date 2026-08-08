import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ensurePortalsForRun, type PortalSpot } from '../../map/portals'
import { useGameStore } from '../../store/gameStore'
import { GalaxyPortal } from './GalaxyPortal'

/** Renders the 3 random galaxy portals for the current run. */
export function PortalSystem() {
  const [spots, setSpots] = useState<PortalSpot[]>([])
  const lastRunId = useRef(-1)

  const sync = (runId: number) => {
    if (runId === lastRunId.current) return
    lastRunId.current = runId
    setSpots([...ensurePortalsForRun(runId)])
  }

  useEffect(() => {
    sync(useGameStore.getState().runId)
  }, [])

  useFrame(() => {
    sync(useGameStore.getState().runId)
  })

  return (
    <group>
      {spots.map((p) => (
        <GalaxyPortal key={`${p.id}-${p.x.toFixed(2)}-${p.z.toFixed(2)}`} portal={p} />
      ))}
    </group>
  )
}
