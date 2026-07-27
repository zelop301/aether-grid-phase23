import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CycleRiderAsset, LightCycleAsset } from '../assets/ImportedAssets.jsx'
import { RIDER_FIT } from './riderFitConfig.js'

const up = new THREE.Vector3(0, 1, 0)
const startVector = new THREE.Vector3()
const endVector = new THREE.Vector3()
const direction = new THREE.Vector3()
const midpoint = new THREE.Vector3()
const segmentQuaternion = new THREE.Quaternion()

const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

function LimbSegment({ start, end, radius = 0.045, color = '#08151d', accent = '#2cecff' }) {
  const transform = useMemo(() => {
    startVector.fromArray(start)
    endVector.fromArray(end)
    direction.subVectors(endVector, startVector)
    const length = direction.length()
    midpoint.addVectors(startVector, endVector).multiplyScalar(0.5)
    segmentQuaternion.setFromUnitVectors(up, direction.normalize())
    return {
      length,
      position: midpoint.toArray(),
      quaternion: segmentQuaternion.toArray(),
    }
  }, [start, end])

  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[radius, Math.max(0.03, transform.length - radius * 2), 4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={accent}
          emissiveIntensity={0.18}
          metalness={0.78}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

function ContactJoint({ position, scale = 0.065, accent }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[scale, 8, 6]} />
      <meshStandardMaterial
        color="#091820"
        emissive={accent}
        emissiveIntensity={0.55}
        metalness={0.72}
        roughness={0.25}
      />
    </mesh>
  )
}

function RiderContactRig({ accent }) {
  const c = RIDER_FIT.contacts
  return (
    <group>
      <LimbSegment start={c.leftShoulder} end={c.leftElbow} accent={accent} />
      <LimbSegment start={c.leftElbow} end={c.leftGrip} radius={0.04} accent={accent} />
      <LimbSegment start={c.rightShoulder} end={c.rightElbow} accent={accent} />
      <LimbSegment start={c.rightElbow} end={c.rightGrip} radius={0.04} accent={accent} />
      <LimbSegment start={c.leftHip} end={c.leftKnee} radius={0.055} accent={accent} />
      <LimbSegment start={c.leftKnee} end={c.leftFoot} radius={0.045} accent={accent} />
      <LimbSegment start={c.rightHip} end={c.rightKnee} radius={0.055} accent={accent} />
      <LimbSegment start={c.rightKnee} end={c.rightFoot} radius={0.045} accent={accent} />
      <ContactJoint position={c.leftGrip} scale={0.055} accent={accent} />
      <ContactJoint position={c.rightGrip} scale={0.055} accent={accent} />
      <ContactJoint position={c.leftFoot} scale={0.052} accent={accent} />
      <ContactJoint position={c.rightFoot} scale={0.052} accent={accent} />
    </group>
  )
}

function EnergyWheel({ wheelRef, position, accent }) {
  return (
    <group ref={wheelRef} position={position}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[RIDER_FIT.wheels.radius, 0.028, 6, 28]} />
        <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.82} depthWrite={false} />
      </mesh>
      {[0, Math.PI / 2].map((rotation) => (
        <mesh key={rotation} rotation={[rotation, 0, 0]}>
          <boxGeometry args={[0.025, 0.055, RIDER_FIT.wheels.radius * 1.72]} />
          <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.42} />
        </mesh>
      ))}
    </group>
  )
}

export default function CycleVehicleRig({ dynamicsRef, shadows = true, accent = '#2cecff' }) {
  const rig = useRef()
  const motorcycle = useRef()
  const rider = useRef()
  const frontSteer = useRef()
  const frontWheel = useRef()
  const rearWheel = useRef()
  const wheelAngle = useRef(0)
  const smoothedAcceleration = useRef(0)

  useFrame(({ clock }, delta) => {
    const dynamics = dynamicsRef.current
    if (!dynamics || !rig.current || !motorcycle.current || !rider.current) return

    const steer = THREE.MathUtils.clamp(dynamics.steer || 0, -1, 1)
    const speed = dynamics.speed || 0
    const rawAcceleration = THREE.MathUtils.clamp(dynamics.acceleration || 0, -8, 8)
    smoothedAcceleration.current = THREE.MathUtils.damp(smoothedAcceleration.current, rawAcceleration, 5.5, delta)
    const acceleration = smoothedAcceleration.current
    const driftMultiplier = dynamics.drifting ? RIDER_FIT.motion.driftBank : RIDER_FIT.motion.bikeBank
    const targetBank = -steer * driftMultiplier
    const targetPitch = THREE.MathUtils.clamp(
      -acceleration * RIDER_FIT.motion.accelerationPitch,
      -RIDER_FIT.motion.maximumPitch,
      RIDER_FIT.motion.maximumPitch,
    )

    rig.current.rotation.z = damp(rig.current.rotation.z, targetBank, 6.8, delta)
    rig.current.rotation.x = damp(rig.current.rotation.x, targetPitch, 5.8, delta)

    const roadPulse = Math.sin(clock.elapsedTime * (2.4 + Math.abs(speed) * 0.06))
    const speedLoad = Math.min(1, Math.abs(speed) / 18)
    const suspensionTarget = roadPulse * RIDER_FIT.motion.suspensionTravel * speedLoad
      - THREE.MathUtils.clamp(acceleration * 0.0012, -0.008, 0.008)
    motorcycle.current.position.y = damp(motorcycle.current.position.y, suspensionTarget, 6.5, delta)

    const riderPitch = RIDER_FIT.motion.baseRiderPitch
      - (dynamics.boosting ? RIDER_FIT.motion.boostCrouch : 0)
      - THREE.MathUtils.clamp(acceleration * 0.008, -0.05, 0.03)
      + (dynamics.braking ? RIDER_FIT.motion.brakeRise : 0)
    rider.current.rotation.x = damp(rider.current.rotation.x, riderPitch, 8.5, delta)
    rider.current.rotation.z = damp(
      rider.current.rotation.z,
      targetBank * 0.92 + steer * RIDER_FIT.motion.riderCounterLean,
      7.6,
      delta,
    )
    rider.current.rotation.y = damp(
      rider.current.rotation.y,
      steer * RIDER_FIT.motion.riderTurnTwist + (dynamics.drifting ? steer * 0.04 : 0),
      7,
      delta,
    )
    rider.current.position.x = damp(
      rider.current.position.x,
      RIDER_FIT.riderRoot.position[0] + steer * RIDER_FIT.motion.riderLateralShift,
      7.2,
      delta,
    )
    rider.current.position.y = damp(
      rider.current.position.y,
      RIDER_FIT.riderRoot.position[1] - suspensionTarget * 0.24 - Math.abs(targetBank) * 0.015,
      7.5,
      delta,
    )
    rider.current.position.z = damp(
      rider.current.position.z,
      RIDER_FIT.riderRoot.position[2]
        + (dynamics.boosting ? RIDER_FIT.motion.riderForwardShift : 0)
        + (Math.abs(speed) > 10 ? 0.018 : 0)
        + (dynamics.braking ? -0.012 : 0),
      7,
      delta,
    )

    if (frontSteer.current) frontSteer.current.rotation.y = damp(frontSteer.current.rotation.y, steer * 0.14, 8, delta)
    wheelAngle.current -= (speed / RIDER_FIT.wheels.radius) * delta
    if (frontWheel.current) frontWheel.current.rotation.x = wheelAngle.current
    if (rearWheel.current) rearWheel.current.rotation.x = wheelAngle.current
  })

  return (
    <group ref={rig}>
      <group ref={motorcycle}>
        <LightCycleAsset shadows={shadows} accent={accent} />
        <group ref={frontSteer} position={RIDER_FIT.wheels.front}>
          <EnergyWheel wheelRef={frontWheel} position={[0, 0, 0]} accent={accent} />
        </group>
        <EnergyWheel wheelRef={rearWheel} position={RIDER_FIT.wheels.rear} accent={accent} />
        <mesh position={[0, 0.78, 0.53]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.52, 0.035, 0.055]} />
          <meshStandardMaterial color="#07131b" emissive={accent} emissiveIntensity={0.55} metalness={0.76} roughness={0.26} />
        </mesh>
        <mesh position={[-0.22, 0.26, -0.64]}>
          <boxGeometry args={[0.12, 0.035, 0.28]} />
          <meshStandardMaterial color="#08131a" metalness={0.78} roughness={0.32} />
        </mesh>
        <mesh position={[0.22, 0.26, -0.64]}>
          <boxGeometry args={[0.12, 0.035, 0.28]} />
          <meshStandardMaterial color="#08131a" metalness={0.78} roughness={0.32} />
        </mesh>
      </group>

      <group ref={rider} position={RIDER_FIT.riderRoot.position}>
        <CycleRiderAsset shadows={shadows} accent={accent} fit={RIDER_FIT.model} />
        {shadows && <RiderContactRig accent={accent} />}
      </group>
    </group>
  )
}
