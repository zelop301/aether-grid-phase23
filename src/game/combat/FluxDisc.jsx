import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { FluxDiscAsset } from '../assets/ImportedAssets.jsx'
import { useGameStore } from '../../store/useGameStore.js'

const discPosition = new THREE.Vector3()
const launchPosition = new THREE.Vector3()
const playerPosition = new THREE.Vector3()
const forward = new THREE.Vector3()
const desiredDirection = new THREE.Vector3()
const returnDirection = new THREE.Vector3()
const enemyPosition = new THREE.Vector3()

function acquireTarget(state, origin, direction, excluded = new Set(), maxDistance = 19, requireFront = true) {
  let best = null
  let bestScore = Infinity
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.active === false || excluded.has(enemy.id)) continue
    enemyPosition.fromArray(enemy.position).setY(enemy.position[1] + 1.2)
    desiredDirection.copy(enemyPosition).sub(origin)
    const distance = desiredDirection.length()
    if (distance > maxDistance || distance < 0.001) continue
    desiredDirection.normalize()
    const alignment = direction.dot(desiredDirection)
    if (requireFront && alignment < 0.2) continue
    const score = distance + (1 - alignment) * 7
    if (score < bestScore) {
      best = enemy.id
      bestScore = score
    }
  }
  return best
}

export default function FluxDisc() {
  const root = useRef()
  const ring = useRef()
  const glow = useRef()
  const observedAttackSerial = useRef(0)
  const active = useRef(false)
  const returning = useRef(false)
  const traveled = useRef(0)
  const targetId = useRef(null)
  const hitIds = useRef(new Set())

  useFrame(({ clock }, delta) => {
    const state = useGameStore.getState()

    if (observedAttackSerial.current !== state.attackSerial && state.discState === 'outbound') {
      observedAttackSerial.current = state.attackSerial
      playerPosition.fromArray(state.playerPosition)
      forward.set(Math.sin(state.playerHeading), 0, Math.cos(state.playerHeading)).normalize()
      launchPosition.copy(playerPosition).addScaledVector(forward, 0.88)
      launchPosition.y = 1.48
      discPosition.copy(launchPosition)
      traveled.current = 0
      hitIds.current = new Set()
      returning.current = false
      active.current = true
      targetId.current = acquireTarget(state, discPosition, forward, hitIds.current)
      if (root.current) {
        root.current.visible = true
        root.current.position.copy(discPosition)
      }
    }

    if (!active.current || !root.current || state.status === 'paused') return

    if (state.status !== 'running' && state.status !== 'mission_complete') {
      active.current = false
      root.current.visible = false
      state.setDiscState('ready')
      return
    }

    if (!returning.current) {
      const target = state.enemies.find((enemy) => enemy.id === targetId.current && enemy.alive && enemy.active !== false)
      if (target) {
        enemyPosition.fromArray(target.position).setY(target.position[1] + 1.22)
        desiredDirection.copy(enemyPosition).sub(discPosition).normalize()
        forward.lerp(desiredDirection, 1 - Math.exp(-8.5 * delta)).normalize()
      }

      const step = 19.5 * delta
      discPosition.addScaledVector(forward, step)
      traveled.current += step

      for (const enemy of state.enemies) {
        if (!enemy.alive || enemy.active === false || hitIds.current.has(enemy.id)) continue
        const dx = discPosition.x - enemy.position[0]
        const dy = discPosition.y - (enemy.position[1] + 1.18)
        const dz = discPosition.z - enemy.position[2]
        if (dx * dx + dy * dy + dz * dz < 2.25) {
          hitIds.current.add(enemy.id)
          state.damageEnemy(enemy.id, enemy.type === 'defender' ? 31 : 36)
          state.spawnHitEffect([enemy.position[0], enemy.position[1] + 1.22, enemy.position[2]], 'cyan')

          if (hitIds.current.size < 2) {
            targetId.current = acquireTarget(state, discPosition, forward, hitIds.current, 9.5, false)
            if (targetId.current) {
              traveled.current = Math.max(0, traveled.current - 3)
              break
            }
          }
          returning.current = true
          targetId.current = null
          state.setDiscState('returning')
          break
        }
      }

      if (traveled.current >= 17.5) {
        returning.current = true
        targetId.current = null
        state.setDiscState('returning')
      }
    } else {
      playerPosition.fromArray(state.playerPosition).setY(1.46)
      returnDirection.copy(playerPosition).sub(discPosition)
      const distance = returnDirection.length()

      if (distance < 0.68) {
        active.current = false
        root.current.visible = false
        state.setDiscState('ready')
        return
      }

      returnDirection.normalize()
      forward.lerp(returnDirection, 1 - Math.exp(-11 * delta)).normalize()
      discPosition.addScaledVector(forward, Math.min(23 * delta, distance))
    }

    root.current.position.copy(discPosition)
    root.current.rotation.y += delta * 13
    root.current.rotation.z += delta * 19
    if (ring.current) ring.current.rotation.x += delta * 9
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 18) * 0.075)
  })

  return (
    <group ref={root} visible={false}>
      <group ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <FluxDiscAsset scale={3.45} />
      </group>
      <mesh ref={glow} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.43, 0.13, 8, 28]} />
        <meshBasicMaterial color="#29e8ff" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color="#2ceeff" intensity={4.2} distance={4.8} decay={2} />
    </group>
  )
}
