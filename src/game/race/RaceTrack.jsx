import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'
import {
  BOOST_PADS,
  RACE_CHECKPOINTS,
  START_ANGLE,
  TRACK_INNER_RADIUS,
  TRACK_OUTER_RADIUS,
  TRACK_RADIUS,
} from './raceConfig.js'

function CheckpointGate({ checkpoint, active, passed }) {
  const root = useRef()
  const pulse = useRef()
  const color = passed ? '#4cffb0' : active ? '#2cecff' : '#2c5f6a'

  useFrame(({ clock }) => {
    if (!root.current || !pulse.current) return
    const time = clock.getElapsedTime()
    root.current.position.y = active ? Math.sin(time * 2.8) * 0.045 : 0
    pulse.current.material.opacity = active ? 0.2 + Math.abs(Math.sin(time * 5)) * 0.23 : passed ? 0.09 : 0.05
  })

  return (
    <group ref={root} position={checkpoint.position} rotation={[0, checkpoint.heading, 0]}>
      {[-4.55, 4.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.48, 0]}>
            <boxGeometry args={[0.18, 2.96, 0.2]} />
            <meshStandardMaterial color="#061017" emissive={color} emissiveIntensity={active ? 3.1 : 0.8} metalness={0.78} roughness={0.25} />
          </mesh>
          <mesh position={[0, 2.94, 0]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.05, 0]}>
        <boxGeometry args={[9.25, 0.16, 0.2]} />
        <meshStandardMaterial color="#061017" emissive={color} emissiveIntensity={active ? 3.2 : 0.8} metalness={0.78} roughness={0.25} />
      </mesh>
      <mesh ref={pulse} position={[0, 1.47, 0]}>
        <planeGeometry args={[8.8, 2.55]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      {active && (
        <group position={[0, 3.72, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.34, 0.34, 0.1]} />
            <meshBasicMaterial color="#e9ffff" toneMapped={false} />
          </mesh>
          <pointLight color="#2cecff" intensity={3.5} distance={7} decay={2} />
        </group>
      )}
    </group>
  )
}

function TrackMarker({ index }) {
  const angle = START_ANGLE - (index / 64) * Math.PI * 2
  const x = Math.cos(angle) * TRACK_RADIUS
  const z = Math.sin(angle) * TRACK_RADIUS
  return (
    <mesh position={[x, 0.052, z]} rotation={[-Math.PI / 2, 0, Math.PI - angle]}>
      <planeGeometry args={[0.12, index % 8 === 0 ? 2.2 : 1.1]} />
      <meshBasicMaterial color={index % 8 === 0 ? '#8e67ff' : '#2ae9ff'} transparent opacity={index % 8 === 0 ? 0.72 : 0.34} toneMapped={false} />
    </mesh>
  )
}

function BoostPad({ pad }) {
  const material = useRef()
  useFrame(({ clock }) => {
    if (material.current) material.current.opacity = 0.42 + Math.sin(clock.getElapsedTime() * 7 + pad.angle) * 0.12
  })
  return (
    <group position={pad.position} rotation={[0, pad.heading, 0]}>
      {[-1.9, -0.65, 0.65, 1.9].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.68, 3.4]} />
          <meshBasicMaterial ref={x === -1.9 ? material : undefined} color="#39f6ff" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0.65, 0]} color="#2cecff" intensity={3.2} distance={5.5} decay={2} />
    </group>
  )
}

function EdgeRail({ radius, color }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <torusGeometry args={[radius, 0.12, 8, 160]} />
        <meshStandardMaterial color="#061117" emissive={color} emissiveIntensity={1.5} metalness={0.78} roughness={0.24} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.58, 0]}>
        <torusGeometry args={[radius, 0.045, 6, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function RaceTrack() {
  const checkpointIndex = useGameStore((state) => state.checkpointIndex)
  const lap = useGameStore((state) => state.lap)
  const raceStatus = useGameStore((state) => state.raceStatus)

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <ringGeometry args={[TRACK_INNER_RADIUS, TRACK_OUTER_RADIUS, 160]} />
        <meshStandardMaterial color="#030a0f" roughness={0.44} metalness={0.72} />
      </mesh>

      <EdgeRail radius={TRACK_INNER_RADIUS} color="#1fe5f8" />
      <EdgeRail radius={TRACK_OUTER_RADIUS} color="#5f79ff" />

      {[TRACK_RADIUS - 2.15, TRACK_RADIUS + 2.15].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <torusGeometry args={[radius, 0.03, 5, 160]} />
          <meshBasicMaterial color={index === 0 ? '#1cdff2' : '#815cff'} transparent opacity={0.4} toneMapped={false} />
        </mesh>
      ))}

      {Array.from({ length: 64 }, (_, index) => <TrackMarker key={index} index={index} />)}
      {BOOST_PADS.map((pad) => <BoostPad key={pad.id} pad={pad} />)}

      {RACE_CHECKPOINTS.map((checkpoint) => {
        const active = raceStatus !== 'complete' && checkpoint.index === checkpointIndex
        const passed = lap > 1 || checkpoint.index < checkpointIndex
        return <CheckpointGate key={checkpoint.id} checkpoint={checkpoint} active={active} passed={passed} />
      })}

      <group position={[0, 0.056, TRACK_RADIUS]} rotation={[0, Math.PI / 2, 0]}>
        {Array.from({ length: 10 }, (_, index) => (
          <mesh key={index} position={[(index - 4.5) * 0.9, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.74, 1.18]} />
            <meshBasicMaterial color={index % 2 === 0 ? '#d9fbff' : '#11262d'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
