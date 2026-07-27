import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'
import { START_ANGLE } from './raceConfig.js'
import EnergyTrail from './EnergyTrail.jsx'
import { RivalCycleAsset } from '../assets/ImportedAssets.jsx'

const position = new THREE.Vector3()

export default function RivalCycle({ blueprint, trailSegments = 42 }) {
  const root = useRef()
  const trail = useRef()
  const progress = useRef(blueprint.startOffset)
  const observedResetNonce = useRef(-1)
  const trailTimer = useRef(0)

  useFrame((_, delta) => {
    if (!root.current) return
    const state = useGameStore.getState()

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      progress.current = blueprint.startOffset
      trail.current?.clear()
    }

    if (state.status === 'running' && state.raceStatus === 'racing') progress.current += blueprint.angularSpeed * delta

    const angle = START_ANGLE - progress.current
    const wobble = Math.sin(progress.current * 7 + blueprint.id.length) * 0.22
    const radius = blueprint.laneRadius + wobble
    position.set(Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius)
    root.current.position.copy(position)
    root.current.rotation.y = Math.PI - angle

    trailTimer.current += delta
    if (trailTimer.current > 0.07 && state.status === 'running' && state.raceStatus === 'racing') {
      trail.current?.push(position)
      trailTimer.current = 0
    }
  })

  return (
    <>
      <EnergyTrail
        ref={trail}
        color={blueprint.color}
        maxSegments={Math.max(24, Math.round(trailSegments * 0.62))}
        height={0.62}
        opacity={0.42}
      />
      <group ref={root}>
        <RivalCycleAsset accent={blueprint.color} />
        <pointLight position={[0, 0.6, -1.4]} color={blueprint.color} intensity={2.4} distance={3.8} />
      </group>
    </>
  )
}
