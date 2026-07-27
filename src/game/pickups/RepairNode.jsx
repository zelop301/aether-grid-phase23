import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const player = new THREE.Vector3()

export default function RepairNode({ id }) {
  const pickup = useGameStore((state) => state.pickups.find((item) => item.id === id))
  const root = useRef()
  const ring = useRef()

  useFrame(({ clock }, delta) => {
    if (!root.current || !pickup?.active) return
    const state = useGameStore.getState()
    root.current.rotation.y += delta * 1.15
    root.current.position.y = pickup.position[1] + Math.sin(clock.elapsedTime * 2.2 + id.length) * 0.16
    if (ring.current) ring.current.rotation.z -= delta * 2.4

    player.fromArray(state.playerPosition)
    const dx = player.x - root.current.position.x
    const dz = player.z - root.current.position.z
    if (dx * dx + dz * dz < 2.15) state.collectPickup(id)
  })

  if (!pickup?.active) return null

  return (
    <group ref={root} position={pickup.position}>
      <mesh>
        <octahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial
          color="#0b2d25"
          emissive="#4dffba"
          emissiveIntensity={3.8}
          metalness={0.58}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.76, 0.045, 8, 28]} />
        <meshBasicMaterial color="#68ffc7" transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <pointLight color="#43ffb4" intensity={3} distance={5} />
    </group>
  )
}
