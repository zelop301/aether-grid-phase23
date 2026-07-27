import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const COLORS = {
  cyan: '#52f2ff',
  orange: '#ff783f',
  rapid: '#ff9a54',
  violet: '#a46cff',
  'boss-shift': '#ffe66a',
  'boss-rage': '#ff355b',
  conduit: '#61f5ff',
}

function HitBurst({ effect }) {
  const root = useRef()
  const ring = useRef()
  const core = useRef()
  const slashA = useRef()
  const slashB = useRef()
  const age = useRef(0)
  const removeHitEffect = useGameStore((state) => state.removeHitEffect)
  const bossEffect = effect.variant === 'boss-shift' || effect.variant === 'boss-rage' || effect.variant === 'conduit'
  const particleCount = bossEffect ? 12 : effect.variant === 'rapid' ? 7 : 9
  const directions = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => {
      const angle = (index / particleCount) * Math.PI * 2
      const lift = ((index % 4) - 1.25) * 0.22
      return new THREE.Vector3(Math.cos(angle), lift, Math.sin(angle)).normalize()
    }),
    [particleCount],
  )

  useFrame((_, delta) => {
    if (useGameStore.getState().status === 'paused') return
    age.current += delta
    if (!root.current) return

    const normalizedAge = Math.min(1, age.current / (bossEffect ? 0.72 : 0.52))
    root.current.rotation.y += delta * (bossEffect ? 3.2 : 1.4)
    root.current.children.slice(4).forEach((child, index) => {
      child.position.addScaledVector(directions[index], delta * ((bossEffect ? 5.2 : 3.8) + index * 0.1))
      child.scale.setScalar(Math.max(0.001, 1 - normalizedAge * 0.92))
      if (child.material) child.material.opacity = Math.max(0, 0.95 - normalizedAge)
    })

    if (ring.current) {
      const size = 0.25 + normalizedAge * (bossEffect ? 3.2 : 1.65)
      ring.current.scale.setScalar(size)
      ring.current.material.opacity = Math.max(0, 0.8 - normalizedAge * 0.82)
    }
    if (core.current) {
      core.current.scale.setScalar(Math.max(0.001, 1.25 - normalizedAge * 1.05))
      core.current.material.opacity = Math.max(0, 0.9 - normalizedAge)
    }
    if (slashA.current && slashB.current) {
      const slashScale = 0.4 + normalizedAge * 1.2
      slashA.current.scale.set(slashScale, Math.max(0.02, 1 - normalizedAge), slashScale)
      slashB.current.scale.copy(slashA.current.scale)
      slashA.current.material.opacity = Math.max(0, 0.72 - normalizedAge)
      slashB.current.material.opacity = slashA.current.material.opacity
    }

    if (age.current > (bossEffect ? 0.72 : 0.52)) removeHitEffect(effect.id)
  })

  const color = COLORS[effect.variant] || COLORS.cyan

  return (
    <group ref={root} position={effect.position}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, bossEffect ? 0.055 : 0.035, 6, 22]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[bossEffect ? 0.2 : 0.13, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={slashA} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[bossEffect ? 1.2 : 0.7, 0.035, 0.035]} />
        <meshBasicMaterial color={color} transparent opacity={0.72} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={slashB} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[bossEffect ? 1.2 : 0.7, 0.035, 0.035]} />
        <meshBasicMaterial color={color} transparent opacity={0.72} toneMapped={false} depthWrite={false} />
      </mesh>
      {directions.map((_, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.055 + (index % 3) * 0.018, 6, 5]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function CombatEffects() {
  const effects = useGameStore((state) => state.hitEffects)

  return (
    <group>
      {effects.map((effect) => <HitBurst key={effect.id} effect={effect} />)}
    </group>
  )
}
