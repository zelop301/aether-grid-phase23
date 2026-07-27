import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { FluxDiscAsset } from '../assets/ImportedAssets.jsx'
import OperatorMotionRig from './OperatorMotionRig.jsx'
import { useGameStore } from '../../store/useGameStore.js'

const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const desiredCamera = new THREE.Vector3()
const desiredLookAt = new THREE.Vector3()
const positionBuffer = new THREE.Vector3()
const cameraLookAt = new THREE.Vector3(0, 1.5, 0)
const cameraOffset = new THREE.Vector3(0, 4.4, -7.3)
const lockTarget = new THREE.Vector3()
const dodgeDirection = new THREE.Vector3()
const actionForward = new THREE.Vector3()

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

function dampAngle(current, target, smoothing, delta) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * (1 - Math.exp(-smoothing * delta))
}

export default function Player({ shadows }) {
  const root = useRef()
  const visual = useRef()
  const holsteredDisc = useRef()
  const damageLight = useRef()
  const lastSpeedUpdate = useRef(0)
  const lastTransformUpdate = useRef(0)
  const observedResetNonce = useRef(0)
  const observedAttackSerial = useRef(0)
  const observedDamageSerial = useRef(0)
  const observedImpactSerial = useRef(0)
  const impactTimer = useRef(0)
  const throwTimer = useRef(0)
  const damageTimer = useRef(0)
  const motionState = useRef({
    moveBlend: 0,
    sprintBlend: 0,
    strafe: 0,
    forward: 0,
    attack: 0,
    damage: 0,
    phase: 0,
    combatAction: 'locomotion',
    combatPhase: 'idle',
    comboStep: 0,
    block: false,
    locked: false,
    actionSerial: 0,
  })

  useFrame(({ camera, clock }, delta) => {
    if (!root.current) return

    const state = useGameStore.getState()
    const { input, status } = state

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      root.current.position.fromArray(state.playerPosition)
      root.current.rotation.y = Math.PI
      velocity.set(0, 0, 0)
      cameraLookAt.set(0, 1.5, 10)
    }

    if (observedAttackSerial.current !== state.attackSerial) {
      observedAttackSerial.current = state.attackSerial
      throwTimer.current = 0.34
    }

    if (observedDamageSerial.current !== state.damageSerial) {
      observedDamageSerial.current = state.damageSerial
      damageTimer.current = 0.32
    }
    if (observedImpactSerial.current !== state.combatImpactSerial) {
      observedImpactSerial.current = state.combatImpactSerial
      impactTimer.current = state.combatImpactKind === 'boss-defeat' ? 0.42 : ['heavy', 'finisher'].includes(state.combatImpactKind) ? 0.22 : 0.1
    }

    const movementEnabled = status === 'running' && !state.storyModal && performance.now() >= state.hitStopUntil
    const actionBusy = ['startup', 'active', 'recovery'].includes(state.combatPhase)
    const dodging = state.combatAction === 'dodge' && state.combatPhase === 'active'
    const movementScale = state.blockHeld ? 0.34 : actionBusy ? 0.28 : 1
    if (!movementEnabled) velocity.set(0, 0, 0)
    const horizontal = movementEnabled ? Number(input.right) - Number(input.left) : 0
    const vertical = movementEnabled ? Number(input.backward) - Number(input.forward) : 0
    direction.set(horizontal, 0, vertical)

    if (direction.lengthSq() > 1) direction.normalize()

    const maxSpeed = (input.sprint ? 8.2 : 5.4) * movementScale
    const targetX = dodging ? 0 : direction.x * maxSpeed
    const targetZ = dodging ? 0 : direction.z * maxSpeed

    velocity.x = damp(velocity.x, targetX, actionBusy ? 13 : 8.5, delta)
    velocity.z = damp(velocity.z, targetZ, actionBusy ? 13 : 8.5, delta)

    if (direction.lengthSq() === 0 || dodging) {
      velocity.x = damp(velocity.x, 0, 11, delta)
      velocity.z = damp(velocity.z, 0, 11, delta)
    }

    root.current.position.x += velocity.x * delta
    root.current.position.z += velocity.z * delta

    if (state.combatPhase === 'active' && ['heavy', 'rapid', 'slam', 'finisher'].includes(state.combatAction)) {
      const impulse = state.combatAction === 'rapid' ? 3.2 : state.combatAction === 'slam' ? 1.4 : 2.1
      actionForward.set(Math.sin(root.current.rotation.y), 0, Math.cos(root.current.rotation.y))
      root.current.position.addScaledVector(actionForward, impulse * delta)
    }

    if (dodging) {
      dodgeDirection.set(state.combatDodgeVector?.[0] || 0, 0, state.combatDodgeVector?.[1] || 1)
      if (dodgeDirection.lengthSq() > 1) dodgeDirection.normalize()
      root.current.position.addScaledVector(dodgeDirection, 10.8 * delta)
    }

    const radius = Math.hypot(root.current.position.x, root.current.position.z)
    if (radius > 48) {
      const factor = 48 / radius
      root.current.position.x *= factor
      root.current.position.z *= factor
      velocity.multiplyScalar(0.35)
    }

    const lockedEnemy = state.enemies.find((enemy) => enemy.id === state.lockOnTargetId && enemy.alive && enemy.active !== false)
    if (lockedEnemy && !dodging) {
      lockTarget.fromArray(lockedEnemy.position)
      const targetRotation = Math.atan2(lockTarget.x - root.current.position.x, lockTarget.z - root.current.position.z)
      root.current.rotation.y = dampAngle(root.current.rotation.y, targetRotation, 15, delta)
    } else if (direction.lengthSq() > 0.01) {
      const targetRotation = Math.atan2(direction.x, direction.z)
      root.current.rotation.y = dampAngle(root.current.rotation.y, targetRotation, 12, delta)
    }

    const speed = Math.hypot(velocity.x, velocity.z)
    const runAmount = THREE.MathUtils.clamp(speed / Math.max(0.1, maxSpeed), 0, 1)
    const phase = clock.getElapsedTime() * (6.5 + speed * 0.45)
    throwTimer.current = Math.max(0, throwTimer.current - delta)
    damageTimer.current = Math.max(0, damageTimer.current - delta)
    impactTimer.current = Math.max(0, impactTimer.current - delta)
    const throwAmount = Math.sin((throwTimer.current / 0.34) * Math.PI)

    motionState.current.moveBlend = runAmount
    motionState.current.sprintBlend = input.sprint ? runAmount : 0
    motionState.current.strafe = horizontal
    motionState.current.forward = -vertical
    motionState.current.attack = throwAmount
    motionState.current.damage = THREE.MathUtils.clamp(damageTimer.current / 0.32, 0, 1)
    motionState.current.phase = phase
    motionState.current.combatAction = state.combatAction
    motionState.current.combatPhase = state.combatPhase
    motionState.current.comboStep = state.combatComboStep
    motionState.current.block = state.blockHeld
    motionState.current.locked = Boolean(lockedEnemy)
    motionState.current.actionSerial = state.combatActionSerial

    if (holsteredDisc.current) {
      holsteredDisc.current.rotation.z += delta * (0.8 + speed * 0.16)
      holsteredDisc.current.visible = state.discState === 'ready'
    }
    if (damageLight.current) {
      damageLight.current.intensity = damageTimer.current > 0 ? 11 : 0
      damageLight.current.color.set(damageTimer.current > 0 ? '#ff4f63' : '#24e5ff')
    }

    lastSpeedUpdate.current += delta
    if (lastSpeedUpdate.current > 0.12) {
      state.setPlayerSpeed(Math.round(speed * 18))
      lastSpeedUpdate.current = 0
    }

    lastTransformUpdate.current += delta
    if (lastTransformUpdate.current > 0.055) {
      positionBuffer.copy(root.current.position)
      state.setPlayerTransform(positionBuffer.toArray(), root.current.rotation.y)
      lastTransformUpdate.current = 0
    }

    const combatCamera = Boolean(lockedEnemy)
    const bossCamera = lockedEnemy?.type === 'commander'
    cameraOffset.set(
      bossCamera ? 1.45 : combatCamera ? 1.15 : 0,
      bossCamera ? 4.15 : combatCamera ? 3.75 : 4.4,
      bossCamera ? -8.15 : combatCamera ? -6.4 : -7.3,
    ).applyQuaternion(root.current.quaternion)
    desiredCamera.copy(root.current.position).add(cameraOffset)
    desiredLookAt.copy(root.current.position).add(new THREE.Vector3(0, bossCamera ? 1.45 : combatCamera ? 1.25 : 1.35, 0))
    if (lockedEnemy) desiredLookAt.lerp(lockTarget.setY(bossCamera ? 1.35 : 1.15), bossCamera ? 0.45 : 0.34)

    const damageShake = damageTimer.current > 0 ? damageTimer.current * 0.35 : 0
    const impactShake = impactTimer.current > 0 ? impactTimer.current * (state.combatImpactKind === 'boss-defeat' ? 0.5 : 0.22) : 0
    const shake = state.screenShake && !state.reducedMotion ? Math.max(damageShake, impactShake) : 0
    const cameraResponse = THREE.MathUtils.clamp(state.cameraSensitivity || 1, 0.6, 1.4)
    camera.position.x = damp(camera.position.x, desiredCamera.x, 5.8 * cameraResponse, delta) + Math.sin(clock.elapsedTime * 52) * shake
    camera.position.y = damp(camera.position.y, desiredCamera.y, 5.8 * cameraResponse, delta) + Math.cos(clock.elapsedTime * 47) * shake * 0.4
    camera.position.z = damp(camera.position.z, desiredCamera.z, 5.8 * cameraResponse, delta)

    cameraLookAt.x = damp(cameraLookAt.x, desiredLookAt.x, 7 * cameraResponse, delta)
    cameraLookAt.y = damp(cameraLookAt.y, desiredLookAt.y, 7 * cameraResponse, delta)
    cameraLookAt.z = damp(cameraLookAt.z, desiredLookAt.z, 7 * cameraResponse, delta)
    camera.lookAt(cameraLookAt)
  })

  return (
    <group ref={root} position={[0, 0.05, 10]} rotation={[0, Math.PI, 0]}>
      <group ref={visual}>
        <OperatorMotionRig shadows={shadows} motionRef={motionState} accent="#73f5ff" />

        <group ref={holsteredDisc} position={[0.5, 1.42, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <FluxDiscAsset scale={2.45} />
        </group>

        <pointLight ref={damageLight} position={[0, 1.3, 0]} color="#ff4f63" intensity={0} distance={5} decay={2} />
      </group>
    </group>
  )
}
