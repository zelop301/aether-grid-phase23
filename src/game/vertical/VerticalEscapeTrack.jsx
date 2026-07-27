import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { VERTICAL_ESCAPE_CHECKPOINTS, useGameStore } from '../../store/useGameStore.js'

function EscapeGate({ gate, index, active, passed }) {
  const root = useRef()
  const panel = useRef()

  useFrame(({ clock }) => {
    if (!root.current || !panel.current) return
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 5.8) * 0.07 : 1
    root.current.scale.setScalar(pulse)
    panel.current.opacity = active ? 0.76 : passed ? 0.13 : 0.24
  })

  const color = active ? '#66f5ff' : passed ? '#34ffa2' : '#5c6485'
  return (
    <group ref={root} position={gate.position}>
      {[-4.4, 4.4].map((x) => (
        <mesh key={x} position={[x, 1.7, 0]}>
          <boxGeometry args={[0.18, 3.4, 0.24]} />
          <meshStandardMaterial color="#061117" emissive={color} emissiveIntensity={active ? 4.8 : 1.2} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 3.35, 0]}>
        <boxGeometry args={[9, 0.18, 0.24]} />
        <meshStandardMaterial color="#061117" emissive={color} emissiveIntensity={active ? 4.8 : 1.2} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <planeGeometry args={[8.5, 2.8]} />
        <meshBasicMaterial ref={panel} color={color} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.7, 0.7]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.28} toneMapped={false} />
      </mesh>
      <group position={[0, 4.05, 0]}>
        <mesh>
          <planeGeometry args={[3.6, 0.5]} />
          <meshBasicMaterial color="#071319" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

export default function VerticalEscapeTrack() {
  const checkpointIndex = useGameStore((state) => state.verticalCheckpointIndex)
  return (
    <group>
      <mesh position={[0, 0.012, -39]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 70]} />
        <meshStandardMaterial color="#03090d" metalness={0.72} roughness={0.42} />
      </mesh>
      {[-12.8, 12.8].map((x) => (
        <mesh key={x} position={[x, 0.08, -39]}>
          <boxGeometry args={[0.14, 0.14, 70]} />
          <meshStandardMaterial color="#07151b" emissive={x < 0 ? '#2cecff' : '#875fff'} emissiveIntensity={3.4} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: 18 }, (_, index) => (
        <mesh key={index} position={[0, 0.045, -7 - index * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 2.1]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#9c6cff' : '#2cecff'} transparent opacity={0.68} toneMapped={false} />
        </mesh>
      ))}
      {VERTICAL_ESCAPE_CHECKPOINTS.map((gate, index) => (
        <EscapeGate key={gate.id} gate={gate} index={index} active={index === checkpointIndex} passed={index < checkpointIndex} />
      ))}
    </group>
  )
}
