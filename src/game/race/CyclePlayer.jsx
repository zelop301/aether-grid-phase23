import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'
import {
  BOOST_PADS,
  CYCLE_SPAWN,
  CYCLE_SPAWN_HEADING,
  RACE_CHECKPOINTS,
  RIVAL_BLUEPRINTS,
  START_ANGLE,
  TOTAL_CHECKPOINTS,
  TRACK_HALF_WIDTH,
  TRACK_INNER_RADIUS,
  TRACK_OUTER_RADIUS,
  TRACK_RADIUS,
} from './raceConfig.js'
import { CYCLE_TUNING, createCycleKinematics, resetCycleKinematics, stepCycleKinematics } from './vehicleModel.js'
import EnergyTrail from './EnergyTrail.jsx'
import CycleVehicleRig from './CycleVehicleRig.jsx'

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const movement = new THREE.Vector3()
const desiredCamera = new THREE.Vector3()
const desiredLookAt = new THREE.Vector3()
const cameraLookAt = new THREE.Vector3(...CYCLE_SPAWN).add(new THREE.Vector3(0, 1.05, 0))
const cameraOffset = new THREE.Vector3()
const positionBuffer = new THREE.Vector3()
const checkpointPosition = new THREE.Vector3()
const padPosition = new THREE.Vector3()
const autopilotTarget = new THREE.Vector3()
const VELOCITY_TUNING = Object.freeze({ ...CYCLE_TUNING, boostDrain: CYCLE_TUNING.boostDrain * 0.8 })

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

function dampAngle(current, target, smoothing, delta) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + difference * (1 - Math.exp(-smoothing * delta))
}

export default function CyclePlayer({ shadows, trailSegments }) {
  const root = useRef()
  const visual = useRef()
  const trail = useRef()
  const observedResetNonce = useRef(-1)
  const observedDamageSerial = useRef(0)
  const damageTimer = useRef(0)
  const trailTimer = useRef(0)
  const telemetryTimer = useRef(0)
  const transformTimer = useRef(0)
  const checkpointLock = useRef(false)
  const collisionLock = useRef(0)
  const padCooldown = useRef(0)
  const kinematics = useRef(createCycleKinematics(CYCLE_SPAWN_HEADING))
  const previousSpeed = useRef(0)
  const smoothedAcceleration = useRef(0)
  const vehicleDynamics = useRef({ speed: 0, acceleration: 0, steer: 0, drifting: false, boosting: false, braking: false })

  useFrame(({ camera, clock }, delta) => {
    if (!root.current) return
    const state = useGameStore.getState()
    const simulationDelta = Math.min(delta, 1 / 30)
    const motion = kinematics.current

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      root.current.position.fromArray(CYCLE_SPAWN)
      root.current.rotation.y = CYCLE_SPAWN_HEADING
      resetCycleKinematics(motion, CYCLE_SPAWN_HEADING)
      previousSpeed.current = 0
      smoothedAcceleration.current = 0
      checkpointLock.current = false
      collisionLock.current = 0
      padCooldown.current = 0
      trail.current?.clear()
      camera.position.set(-7.4, 3.15, TRACK_OUTER_RADIUS + 0.5)
      cameraLookAt.fromArray(CYCLE_SPAWN).add(new THREE.Vector3(0, 1.05, 0))
    }

    if (observedDamageSerial.current !== state.damageSerial) {
      observedDamageSerial.current = state.damageSerial
      damageTimer.current = 0.36
    }
    damageTimer.current = Math.max(0, damageTimer.current - delta)
    collisionLock.current = Math.max(0, collisionLock.current - delta)
    padCooldown.current = Math.max(0, padCooldown.current - delta)

    const controlsEnabled = state.status === 'running' && state.raceStatus === 'racing'
    if (!controlsEnabled) {
      motion.speed = THREE.MathUtils.damp(motion.speed, 0, 7, delta)
      motion.lateralSpeed = THREE.MathUtils.damp(motion.lateralSpeed, 0, 9, delta)
    }

    const autopilotActive = controlsEnabled && state.autopilotEnabled
    let driveThrottle = controlsEnabled && state.input.forward
    let driveBrake = controlsEnabled && state.input.backward
    let driveSteer = controlsEnabled ? Number(state.input.right) - Number(state.input.left) : 0
    let driveDrift = controlsEnabled && state.input.drift
    let driveBoost = controlsEnabled && state.input.sprint

    if (autopilotActive) {
      const positionAngle = Math.atan2(root.current.position.z, root.current.position.x)
      const speedRatio = THREE.MathUtils.clamp(Math.abs(motion.speed) / 24, 0, 1)
      const lookAhead = THREE.MathUtils.lerp(0.16, 0.29, speedRatio)
      const targetAngle = positionAngle - lookAhead
      autopilotTarget.set(Math.cos(targetAngle) * TRACK_RADIUS, 0, Math.sin(targetAngle) * TRACK_RADIUS)
      const desiredHeading = Math.atan2(
        autopilotTarget.x - root.current.position.x,
        autopilotTarget.z - root.current.position.z,
      )
      const headingError = Math.atan2(
        Math.sin(desiredHeading - motion.heading),
        Math.cos(desiredHeading - motion.heading),
      )
      const radialError = (Math.hypot(root.current.position.x, root.current.position.z) - TRACK_RADIUS) / TRACK_HALF_WIDTH
      driveSteer = THREE.MathUtils.clamp(headingError * 1.75 + radialError * 0.22, -1, 1)
      driveThrottle = true
      driveBrake = Math.abs(headingError) > 0.72 && motion.speed > 17
      driveDrift = false
      driveBoost = Math.abs(headingError) < 0.24 && motion.speed > 13 && motion.boost > 38
    }

    const response = stepCycleKinematics(motion, {
      throttle: driveThrottle,
      brake: driveBrake,
      steer: driveSteer,
      drift: driveDrift,
      boost: driveBoost,
    }, simulationDelta, state.selectedDoctrine === 'velocity' ? VELOCITY_TUNING : CYCLE_TUNING)

    const rawAcceleration = THREE.MathUtils.clamp((motion.speed - previousSpeed.current) / Math.max(delta, 0.001), -10, 10)
    smoothedAcceleration.current = THREE.MathUtils.damp(smoothedAcceleration.current, rawAcceleration, 5.5, delta)
    const acceleration = smoothedAcceleration.current
    previousSpeed.current = motion.speed
    Object.assign(vehicleDynamics.current, {
      speed: motion.speed,
      acceleration,
      steer: response.steer,
      drifting: response.drifting,
      boosting: response.boosting,
      braking: Boolean(driveBrake),
    })

    root.current.rotation.y = motion.heading
    forward.set(Math.sin(motion.heading), 0, Math.cos(motion.heading))
    right.set(forward.z, 0, -forward.x)
    movement.copy(forward).multiplyScalar(motion.speed).addScaledVector(right, motion.lateralSpeed)
    root.current.position.addScaledVector(movement, simulationDelta)

    const radialDistance = Math.hypot(root.current.position.x, root.current.position.z)
    const minimumRadius = TRACK_INNER_RADIUS + 0.52
    const maximumRadius = TRACK_OUTER_RADIUS - 0.52
    if (radialDistance < minimumRadius || radialDistance > maximumRadius) {
      const targetRadius = THREE.MathUtils.clamp(radialDistance, minimumRadius, maximumRadius)
      const factor = targetRadius / Math.max(0.001, radialDistance)
      root.current.position.x *= factor
      root.current.position.z *= factor
      const angle = Math.atan2(root.current.position.z, root.current.position.x)
      const tangentHeading = Math.PI - angle
      const assistStrength = state.drivingAssist === 'full' ? 7.2 : state.drivingAssist === 'light' ? 5.4 : 3.4
      motion.heading = dampAngle(motion.heading, tangentHeading, assistStrength, delta)
      motion.lateralSpeed = THREE.MathUtils.damp(motion.lateralSpeed, 0, state.drivingAssist === 'off' ? 8 : 13, delta)
      if (collisionLock.current <= 0) {
        motion.speed *= state.drivingAssist === 'full' ? 0.93 : state.drivingAssist === 'light' ? 0.88 : 0.8
        collisionLock.current = 0.4
        const severity = THREE.MathUtils.clamp(Math.abs(motion.speed) / 18, 0.45, 1.15)
        if (state.registerCycleCollision(severity)) {
          state.spawnHitEffect([root.current.position.x, 0.62, root.current.position.z], 'orange')
        }
      }
    }

    if (controlsEnabled && padCooldown.current <= 0) {
      for (const pad of BOOST_PADS) {
        padPosition.fromArray(pad.position)
        if (root.current.position.distanceToSquared(padPosition) < 9.5) {
          motion.boost = Math.min(100, motion.boost + 34)
          motion.speed = Math.max(motion.speed, 19)
          padCooldown.current = 1.1
          state.spawnHitEffect([root.current.position.x, 0.45, root.current.position.z], 'cyan')
          break
        }
      }
    }

    if (controlsEnabled && collisionLock.current <= 0) {
      for (const rival of RIVAL_BLUEPRINTS) {
        const rivalProgress = state.rivalProgress[rival.id]
        if (!Number.isFinite(rivalProgress)) continue
        const rivalAngle = START_ANGLE - (rivalProgress / TOTAL_CHECKPOINTS) * Math.PI * 2
        padPosition.set(Math.cos(rivalAngle) * rival.laneRadius, 0.08, Math.sin(rivalAngle) * rival.laneRadius)
        if (root.current.position.distanceToSquared(padPosition) < 2.45) {
          collisionLock.current = 0.55
          motion.speed *= 0.82
          motion.lateralSpeed += rival.laneRadius < Math.hypot(root.current.position.x, root.current.position.z) ? 0.85 : -0.85
          state.registerCycleCollision(0.72)
          state.spawnHitEffect([root.current.position.x, 0.6, root.current.position.z], 'orange')
          break
        }
      }
    }

    if (controlsEnabled && state.checkpointIndex < RACE_CHECKPOINTS.length) {
      const checkpoint = RACE_CHECKPOINTS[state.checkpointIndex]
      checkpointPosition.fromArray(checkpoint.position)
      const distanceSq = root.current.position.distanceToSquared(checkpointPosition)
      if (distanceSq < 16 && !checkpointLock.current) {
        checkpointLock.current = true
        state.passRaceCheckpoint(checkpoint.index)
      } else if (distanceSq > 32) {
        checkpointLock.current = false
      }
    }

    if (visual.current) {
      const impactScale = damageTimer.current > 0 ? 1 + Math.sin(clock.elapsedTime * 24) * 0.008 : 1
      visual.current.scale.setScalar(impactScale)
    }

    trailTimer.current += delta
    if (trailTimer.current > 0.09 && Math.abs(motion.speed) > 2) {
      trail.current?.push(root.current.position)
      trailTimer.current = 0
    }

    telemetryTimer.current += delta
    if (telemetryTimer.current > 0.14) {
      state.setCycleTelemetry(Math.round(Math.abs(motion.speed) * 10), Math.round(motion.boost), response.drifting)
      telemetryTimer.current = 0
    }

    transformTimer.current += delta
    if (transformTimer.current > 0.11) {
      positionBuffer.copy(root.current.position)
      state.setPlayerTransform(positionBuffer.toArray(), motion.heading)
      transformTimer.current = 0
    }

    const speedRatio = THREE.MathUtils.clamp(Math.abs(motion.speed) / 30, 0, 1)
    const insideTunnel = root.current.position.z < -26 && Math.abs(root.current.position.x) < 12.5
    const cameraDistance = insideTunnel ? THREE.MathUtils.lerp(5.8, 6.8, speedRatio) : THREE.MathUtils.lerp(6.45, 8.35, speedRatio)
    const cameraHeight = insideTunnel ? 2.12 : THREE.MathUtils.lerp(2.28, 2.68, speedRatio)
    const sideOffset = response.steer * (response.drifting ? 0.42 : 0.22)
    cameraOffset.set(sideOffset, cameraHeight, -cameraDistance).applyQuaternion(root.current.quaternion)
    desiredCamera.copy(root.current.position).add(cameraOffset)
    desiredLookAt
      .copy(root.current.position)
      .addScaledVector(forward, THREE.MathUtils.lerp(4.8, 8.1, speedRatio))
      .addScaledVector(right, response.steer * (response.drifting ? 0.62 : 0.32))
      .setY(0.92)

    const shake = state.screenShake && damageTimer.current > 0 ? damageTimer.current * 0.08 : 0
    const cameraResponse = THREE.MathUtils.clamp(state.cameraSensitivity || 1, 0.6, 1.4)
    const cameraSmoothing = (insideTunnel ? 8.6 : response.drifting ? 7.4 : 6.6) * cameraResponse
    camera.position.x = damp(camera.position.x, desiredCamera.x, cameraSmoothing, delta) + Math.sin(clock.elapsedTime * 31) * shake
    camera.position.y = damp(camera.position.y, desiredCamera.y, cameraSmoothing, delta) + Math.cos(clock.elapsedTime * 27) * shake * 0.18
    camera.position.z = damp(camera.position.z, desiredCamera.z, cameraSmoothing, delta)
    cameraLookAt.lerp(desiredLookAt, 1 - Math.exp(-(response.drifting ? 8.2 : 7.4) * cameraResponse * delta))
    camera.lookAt(cameraLookAt)
    const targetFov = 55 + speedRatio * 10 + (response.boosting ? 1.5 : 0)
    const nextFov = damp(camera.fov, targetFov, 4.6, delta)
    if (Math.abs(nextFov - camera.fov) > 0.01) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <EnergyTrail ref={trail} color="#2cecff" maxSegments={trailSegments} height={0.66} opacity={0.5} />
      <group ref={root} position={CYCLE_SPAWN} rotation={[0, CYCLE_SPAWN_HEADING, 0]}>
        <group ref={visual}>
          <CycleVehicleRig shadows={shadows} accent="#2cecff" dynamicsRef={vehicleDynamics} />
          {shadows && <pointLight position={[0, 0.72, -1.25]} color="#28eaff" intensity={2.2} distance={3.8} decay={2} />}
        </group>
      </group>
    </>
  )
}
