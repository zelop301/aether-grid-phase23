import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const pathPoints = Array.from({ length: 9 }, (_, index) => [0, 0.045, 20 - index * 4.35])
const pylonPoints = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2
  return [Math.sin(angle) * 21, 0, Math.cos(angle) * 21]
})

function SignalPath() {
  return (
    <group>
      {pathPoints.map((position, index) => (
        <mesh key={index} position={position} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.52, 6]} />
          <meshBasicMaterial color="#39e9ff" transparent opacity={0.42 + index * 0.035} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function CombatPylons({ wave }) {
  const group = useRef()
  const color = wave === 3 ? '#f4ee72' : wave === 2 ? '#a36cff' : '#ff5268'
  useFrame(({ clock }, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * (wave === 3 ? 0.14 : 0.07)
    const pulse = 1 + Math.sin(clock.elapsedTime * (2 + wave * 0.45)) * 0.035
    group.current.scale.setScalar(pulse)
  })
  return (
    <group ref={group}>
      {pylonPoints.map((position, index) => (
        <group key={index} position={position} rotation={[0, (index / 6) * Math.PI * 2, 0]}>
          <mesh position={[0, 1.7, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.32, 3.4, 6]} />
            <meshStandardMaterial color="#071017" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.65, 0]}>
            <octahedronGeometry args={[0.36, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 2.5, 0]} color={color} intensity={wave === 3 ? 3.4 : 2} distance={5.5} decay={2} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[19.6, 20, 96]} />
        <meshBasicMaterial color={color} transparent opacity={wave === 3 ? 0.5 : 0.28} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function GenesisBreachEnvironment() {
  const stage = useGameStore((state) => state.verticalStage)
  const wave = useGameStore((state) => state.verticalWave)
  const mounted = useGameStore((state) => state.verticalMounted)
  const showPath = stage === 0
  const showCombat = stage === 1
  return (
    <group>
      {showPath && <SignalPath />}
      {showCombat && <CombatPylons wave={Math.max(1, wave)} />}
      {stage === 2 && !mounted && (
        <group position={[0, 0.05, -10]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.1, 2.45, 48]} />
            <meshBasicMaterial color="#2cecff" transparent opacity={0.7} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 1, 0]} color="#2cecff" intensity={5} distance={9} decay={2} />
        </group>
      )}
    </group>
  )
}
