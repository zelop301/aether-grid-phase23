import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { ARENA_CONDUIT_IDS, useGameStore } from '../../store/useGameStore.js'

const player = new THREE.Vector3()

function Conduit({ id }) {
  const conduit = useGameStore((state) => state.arenaConduits.find((item) => item.id === id))
  const playerPosition = useGameStore((state) => state.playerPosition)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const root = useRef()
  const core = useRef()
  const rings = useRef()
  const rechargeRequested = useRef(false)

  useFrame(({ clock }, delta) => {
    if (!conduit || !root.current) return
    const now = Date.now()
    if (!conduit.active && conduit.readyAt > 0 && now >= conduit.readyAt && !rechargeRequested.current) {
      rechargeRequested.current = true
      useGameStore.getState().rechargeArenaConduit(id)
    }
    if (conduit.active) rechargeRequested.current = false

    const pulse = conduit.active ? 1 + Math.sin(clock.elapsedTime * 4.4 + id.length) * 0.07 : 0.82
    root.current.scale.setScalar(THREE.MathUtils.lerp(root.current.scale.x, pulse, 1 - Math.exp(-7 * delta)))
    if (rings.current && !reducedMotion) rings.current.rotation.y += delta * (conduit.active ? 1.35 : 0.18)
    if (core.current) core.current.material.emissiveIntensity = conduit.active ? 3.2 + Math.sin(clock.elapsedTime * 8) * 0.8 : 0.35
  })

  if (!conduit) return null
  player.fromArray(playerPosition)
  const dx = conduit.position[0] - player.x
  const dz = conduit.position[2] - player.z
  const nearby = conduit.active && dx * dx + dz * dz < 18
  const cooldown = conduit.active ? 0 : Math.max(0, Math.ceil((conduit.readyAt - Date.now()) / 1000))

  return (
    <group ref={root} position={conduit.position}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.76, 1.24, 8]} />
        <meshStandardMaterial color="#071117" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh ref={core} position={[0, 1.28, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#bffcff" emissive="#35edff" emissiveIntensity={3.2} metalness={0.35} roughness={0.12} toneMapped={false} />
      </mesh>
      <group ref={rings} position={[0, 1.28, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.76, 0.045, 6, 28]} />
          <meshBasicMaterial color={conduit.active ? '#38efff' : '#31444b'} transparent opacity={conduit.active ? 0.82 : 0.28} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.59, 0.035, 6, 24]} />
          <meshBasicMaterial color={conduit.active ? '#8d69ff' : '#27383f'} transparent opacity={conduit.active ? 0.72 : 0.22} toneMapped={false} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[1.28, 1.48, 40]} />
        <meshBasicMaterial color={conduit.active ? '#35eaff' : '#26383f'} transparent opacity={conduit.active ? 0.48 : 0.16} toneMapped={false} />
      </mesh>
      {conduit.active && <pointLight position={[0, 1.4, 0]} color="#35eaff" intensity={3.4} distance={7} decay={2} />}
      {(nearby || !conduit.active) && (
        <Html position={[0, 2.15, 0]} center distanceFactor={13} className="conduit-tag-wrapper">
          <div className={`conduit-tag ${conduit.active ? 'ready' : 'cooling'}`}>
            <strong>{conduit.active ? 'E // OVERLOAD' : `RECHARGE ${cooldown}s`}</strong>
            <span>{conduit.label}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function AetherConduits() {
  const gameMode = useGameStore((state) => state.gameMode)
  const storyStage = useGameStore((state) => state.storyStage)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const visible = gameMode === 'combat' || (gameMode === 'story' && storyStage === 2) || (gameMode === 'vertical' && verticalStage === 1)
  if (!visible) return null
  return <group>{ARENA_CONDUIT_IDS.map((id) => <Conduit key={id} id={id} />)}</group>
}
