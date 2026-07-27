import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const ACCENTS = {
  relay: '#28e8ff',
  archive: '#9d73ff',
  core: '#ffb14a',
}

export default function StoryTerminal({ terminal, active, shadows }) {
  const root = useRef()
  const ring = useRef()
  const beacon = useRef()
  const accent = ACCENTS[terminal.type] || '#28e8ff'

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    const time = clock.getElapsedTime()
    root.current.position.y = terminal.position[1] + Math.sin(time * 1.8 + terminal.id.length) * 0.08
    if (ring.current) ring.current.rotation.z += delta * (active ? 1.7 : 0.55)
    if (beacon.current) {
      beacon.current.material.opacity = active ? 0.2 + Math.sin(time * 3.1) * 0.06 : 0.05
      beacon.current.scale.y = active ? 1 + Math.sin(time * 2.4) * 0.08 : 0.7
    }
  })

  const completed = terminal.completed
  const opacity = completed ? 0.28 : active ? 1 : 0.48

  return (
    <group ref={root} position={terminal.position}>
      <mesh castShadow={shadows} receiveShadow={shadows} position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.58, 0.82, 1.55, 8]} />
        <meshStandardMaterial
          color="#061218"
          emissive={accent}
          emissiveIntensity={active ? 1.9 : completed ? 0.2 : 0.65}
          metalness={0.85}
          roughness={0.22}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh ref={ring} position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.74, 0.055, 8, 30]} />
        <meshBasicMaterial color={accent} transparent opacity={completed ? 0.2 : active ? 0.92 : 0.4} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.62, 0]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#ecfeff" emissive={accent} emissiveIntensity={active ? 5 : 1.4} toneMapped={false} />
      </mesh>

      <mesh ref={beacon} position={[0, 5.2, 0]}>
        <cylinderGeometry args={[0.08, 0.42, 7.2, 10, 1, true]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={active ? 0.2 : 0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {active && (
        <pointLight position={[0, 1.6, 0]} color={accent} intensity={7} distance={8} decay={2} />
      )}

      <Html position={[0, 2.55, 0]} center distanceFactor={12} className="story-terminal-label-wrapper">
        <div className={`story-terminal-label ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
          <span>{terminal.label}</span>
          <small>{completed ? 'MEMORY SECURED' : active ? 'INTERACTION AVAILABLE' : 'LOCKED'}</small>
        </div>
      </Html>
    </group>
  )
}
