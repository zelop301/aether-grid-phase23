import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import CycleVehicleRig from '../race/CycleVehicleRig.jsx'
import EnergyTrail from '../race/EnergyTrail.jsx'
import { CYCLE_TUNING, createCycleKinematics, resetCycleKinematics, stepCycleKinematics } from '../race/vehicleModel.js'
import {
  VERTICAL_CYCLE_HEADING,
  VERTICAL_CYCLE_SPAWN,
  VERTICAL_ESCAPE_CHECKPOINTS,
  useGameStore,
} from '../../store/useGameStore.js'

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const movement = new THREE.Vector3()
const desiredCamera = new THREE.Vector3()
const desiredLookAt = new THREE.Vector3()
const cameraLookAt = new THREE.Vector3(0, 1.05, -10)
const positionBuffer = new THREE.Vector3()
const gatePosition = new THREE.Vector3()
const cameraOffset = new THREE.Vector3()
const VELOCITY_TUNING = Object.freeze({ ...CYCLE_TUNING, boostDrain: CYCLE_TUNING.boostDrain * 0.8 })
const damp = (current, target, smoothing, delta) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

export default function VerticalEscapeCycle({ shadows, trailSegments }) {
  const root = useRef()
  const visual = useRef()
  const trail = useRef()
  const motion = useRef(createCycleKinematics(VERTICAL_CYCLE_HEADING))
  const elapsed = useRef(0)
  const telemetryTimer = useRef(0)
  const transformTimer = useRef(0)
  const trailTimer = useRef(0)
  const gateLock = useRef(false)
  const collisionLock = useRef(0)
  const observedResetNonce = useRef(-1)
  const previousSpeed = useRef(0)
  const smoothedAcceleration = useRef(0)
  const vehicleDynamics = useRef({ speed: 0, acceleration: 0, steer: 0, drifting: false, boosting: false, braking: false })

  useFrame(({ camera, clock }, delta) => {
    if (!root.current) return
    const state = useGameStore.getState()
    const simulationDelta = Math.min(delta, 1 / 30)
    const kinematics = motion.current

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      root.current.position.fromArray(VERTICAL_CYCLE_SPAWN)
      root.current.rotation.y = VERTICAL_CYCLE_HEADING
      resetCycleKinematics(kinematics, VERTICAL_CYCLE_HEADING)
      previousSpeed.current = 0
      smoothedAcceleration.current = 0
      elapsed.current = 0
      gateLock.current = false
      collisionLock.current = 0
      trail.current?.clear?.()
    }

    if (state.status !== 'running' || state.storyModal || !state.verticalMounted) return
    collisionLock.current = Math.max(0, collisionLock.current - delta)

    const response = stepCycleKinematics(kinematics, {
      throttle: state.input.forward,
      brake: state.input.backward,
      steer: Number(state.input.right) - Number(state.input.left),
      drift: state.input.drift,
      boost: state.input.sprint,
    }, simulationDelta, state.selectedDoctrine === 'velocity' ? VELOCITY_TUNING : CYCLE_TUNING)

    const rawAcceleration = THREE.MathUtils.clamp((kinematics.speed - previousSpeed.current) / Math.max(delta, 0.001), -10, 10)
    smoothedAcceleration.current = THREE.MathUtils.damp(smoothedAcceleration.current, rawAcceleration, 5.5, delta)
    const acceleration = smoothedAcceleration.current
    previousSpeed.current = kinematics.speed
    Object.assign(vehicleDynamics.current, {
      speed: kinematics.speed,
      acceleration,
      steer: response.steer,
      drifting: response.drifting,
      boosting: response.boosting,
      braking: Boolean(state.input.backward),
    })

    root.current.rotation.y = kinematics.heading
    forward.set(Math.sin(kinematics.heading), 0, Math.cos(kinematics.heading))
    right.set(forward.z, 0, -forward.x)
    movement.copy(forward).multiplyScalar(kinematics.speed).addScaledVector(right, kinematics.lateralSpeed)
    root.current.position.addScaledVector(movement, simulationDelta)

    const outsideX = Math.abs(root.current.position.x) > 12.65
    const outsideZ = root.current.position.z > -6 || root.current.position.z < -74
    if (outsideX || outsideZ) {
      root.current.position.x = THREE.MathUtils.clamp(root.current.position.x, -12.65, 12.65)
      root.current.position.z = THREE.MathUtils.clamp(root.current.position.z, -74, -6)
      kinematics.lateralSpeed = THREE.MathUtils.damp(kinematics.lateralSpeed, 0, 12, delta)
      if (collisionLock.current <= 0) {
        kinematics.speed *= 0.86
        collisionLock.current = 0.42
        state.registerCycleCollision(Math.max(0.5, Math.abs(kinematics.speed) / 18))
        state.spawnHitEffect([root.current.position.x, 0.5, root.current.position.z], 'orange')
      }
    }

    if (visual.current) visual.current.position.y = THREE.MathUtils.damp(visual.current.position.y, 0.012, 7, delta)

    const activeGate = VERTICAL_ESCAPE_CHECKPOINTS[state.verticalCheckpointIndex]
    if (activeGate) {
      gatePosition.fromArray(activeGate.position)
      const distanceSq = root.current.position.distanceToSquared(gatePosition)
      if (distanceSq < 20 && !gateLock.current) {
        gateLock.current = true
        state.passVerticalCheckpoint(state.verticalCheckpointIndex)
      }
      if (distanceSq > 42) gateLock.current = false
    }

    elapsed.current += delta
    telemetryTimer.current += delta
    if (telemetryTimer.current > 0.14) {
      state.setCycleTelemetry(Math.round(Math.abs(kinematics.speed) * 10), Math.round(kinematics.boost), response.drifting)
      state.setVerticalTime(elapsed.current)
      telemetryTimer.current = 0
    }

    transformTimer.current += delta
    if (transformTimer.current > 0.11) {
      positionBuffer.copy(root.current.position)
      state.setPlayerTransform(positionBuffer.toArray(), kinematics.heading)
      transformTimer.current = 0
    }

    trailTimer.current += delta
    if (trailTimer.current > 0.09 && Math.abs(kinematics.speed) > 2) {
      trail.current?.push?.(root.current.position)
      trailTimer.current = 0
    }

    const speedRatio = THREE.MathUtils.clamp(Math.abs(kinematics.speed) / 30, 0, 1)
    const insideTunnel = root.current.position.z < -27 && root.current.position.z > -40
    const cameraDistance = insideTunnel ? 5.85 : THREE.MathUtils.lerp(6.35, 8.15, speedRatio)
    const cameraHeight = insideTunnel ? 2.08 : THREE.MathUtils.lerp(2.25, 2.64, speedRatio)
    cameraOffset.set(response.steer * (response.drifting ? 0.38 : 0.2), cameraHeight, -cameraDistance).applyQuaternion(root.current.quaternion)
    desiredCamera.copy(root.current.position).add(cameraOffset)
    desiredLookAt
      .copy(root.current.position)
      .addScaledVector(forward, THREE.MathUtils.lerp(4.8, 7.8, speedRatio))
      .addScaledVector(right, response.steer * (response.drifting ? 0.55 : 0.28))
      .setY(0.92)
    const cameraResponse = THREE.MathUtils.clamp(state.cameraSensitivity || 1, 0.6, 1.4)
    const cameraSmoothing = (insideTunnel ? 8.5 : response.drifting ? 7.3 : 6.5) * cameraResponse
    camera.position.x = damp(camera.position.x, desiredCamera.x, cameraSmoothing, delta)
    camera.position.y = damp(camera.position.y, desiredCamera.y, cameraSmoothing, delta)
    camera.position.z = damp(camera.position.z, desiredCamera.z, cameraSmoothing, delta)
    cameraLookAt.lerp(desiredLookAt, 1 - Math.exp(-(response.drifting ? 8 : 7.2) * cameraResponse * delta))
    camera.lookAt(cameraLookAt)
    const targetFov = 55 + speedRatio * 10 + (response.boosting ? 1.5 : 0)
    const nextFov = damp(camera.fov, targetFov, 4.5, delta)
    if (Math.abs(nextFov - camera.fov) > 0.01) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <EnergyTrail ref={trail} color="#2cecff" maxSegments={trailSegments} height={0.66} opacity={0.5} />
      <group ref={root} position={VERTICAL_CYCLE_SPAWN} rotation={[0, VERTICAL_CYCLE_HEADING, 0]}>
        <group ref={visual}>
          <CycleVehicleRig shadows={shadows} accent="#2cecff" dynamicsRef={vehicleDynamics} />
          {shadows && <pointLight position={[0, 0.72, -1.25]} color="#2cecff" intensity={2.2} distance={3.8} decay={2} />}
        </group>
      </group>
    </>
  )
}
