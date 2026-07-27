import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import AutoRigOperator from './AutoRigOperator.jsx'

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

export default function OperatorMotionRig({ shadows = true, motionRef, accent = '#73f5ff' }) {
  const root = useRef()
  const chestBar = useRef()

  useFrame((_, delta) => {
    const motion = motionRef?.current || {}
    const move = motion.moveBlend || 0
    const attack = motion.attack || 0
    const sprint = motion.sprintBlend || 0
    const phaseName = motion.combatPhase || 'idle'
    const active = phaseName === 'active' ? 1 : phaseName === 'startup' ? 0.55 : 0

    if (root.current) {
      root.current.rotation.y = damp(root.current.rotation.y, (motion.strafe || 0) * 0.025, 9, delta)
    }
    if (chestBar.current) {
      chestBar.current.scale.x = damp(chestBar.current.scale.x, 1 + sprint * 0.08 + attack * 0.12 + active * 0.08, 9, delta)
      chestBar.current.material.opacity = damp(chestBar.current.material.opacity, 0.72 + move * 0.08 + active * 0.12, 9, delta)
    }
  })

  return (
    <group ref={root}>
      <AutoRigOperator shadows={shadows} motionRef={motionRef} accent={accent} />
      <mesh ref={chestBar} position={[0, 2.13, 0.34]}>
        <boxGeometry args={[0.46, 0.055, 0.018]} />
        <meshBasicMaterial color={accent} transparent opacity={0.78} toneMapped={false} />
      </mesh>
    </group>
  )
}
