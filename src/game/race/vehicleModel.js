import * as THREE from 'three'

export const CYCLE_TUNING = Object.freeze({
  acceleration: 11.8,
  boostAcceleration: 17.5,
  brake: 20.5,
  reverseAcceleration: 5.8,
  coastDrag: 1.95,
  maxSpeed: 21.5,
  boostMaxSpeed: 28.5,
  reverseMaxSpeed: 4.2,
  boostDrain: 27,
  boostRecharge: 15,
  driftRecharge: 8,
  lowSpeedTurn: 1.42,
  highSpeedTurn: 0.62,
  driftTurnMultiplier: 1.16,
  normalGrip: 10.5,
  driftGrip: 4.6,
  driftSlip: 0.13,
  steerResponse: 5.8,
  steerReturn: 6.4,
  yawResponse: 6.2,
  inputDeadzone: 0.06,
})

export function createCycleKinematics(heading = 0) {
  return { speed: 0, heading, lateralSpeed: 0, boost: 100, steer: 0, yawRate: 0 }
}

export function resetCycleKinematics(target, heading = 0) {
  target.speed = 0
  target.heading = heading
  target.lateralSpeed = 0
  target.boost = 100
  target.steer = 0
  target.yawRate = 0
  return target
}

export function stepCycleKinematics(kinematics, input, delta, tuning = CYCLE_TUNING) {
  const step = Math.min(Math.max(delta, 0), 1 / 30)
  const throttle = Boolean(input.throttle)
  const braking = Boolean(input.brake)
  const rawSteer = THREE.MathUtils.clamp(input.steer || 0, -1, 1)
  const steerTarget = Math.abs(rawSteer) < tuning.inputDeadzone ? 0 : rawSteer
  const steerSmoothing = steerTarget === 0 ? tuning.steerReturn : tuning.steerResponse
  kinematics.steer = THREE.MathUtils.damp(kinematics.steer, steerTarget, steerSmoothing, step)

  const drifting = Boolean(input.drift)
    && Math.abs(kinematics.speed) > 8.5
    && Math.abs(kinematics.steer) > 0.12
  const boosting = Boolean(input.boost) && throttle && kinematics.boost > 0.5

  if (throttle) {
    kinematics.speed += (boosting ? tuning.boostAcceleration : tuning.acceleration) * step
  } else if (braking) {
    if (kinematics.speed > 0.15) kinematics.speed = Math.max(0, kinematics.speed - tuning.brake * step)
    else kinematics.speed -= tuning.reverseAcceleration * step
  } else {
    kinematics.speed = THREE.MathUtils.damp(kinematics.speed, 0, tuning.coastDrag, step)
  }

  const speedLimit = boosting ? tuning.boostMaxSpeed : tuning.maxSpeed
  kinematics.speed = THREE.MathUtils.clamp(kinematics.speed, -tuning.reverseMaxSpeed, speedLimit)

  if (boosting) kinematics.boost = Math.max(0, kinematics.boost - tuning.boostDrain * step)
  else kinematics.boost = Math.min(100, kinematics.boost + (drifting ? tuning.driftRecharge : tuning.boostRecharge) * step)

  const absoluteSpeed = Math.abs(kinematics.speed)
  const speedRatio = THREE.MathUtils.clamp(absoluteSpeed / tuning.maxSpeed, 0, 1)
  const speedAuthority = THREE.MathUtils.smoothstep(absoluteSpeed, 0.45, 4.5)
  const steeringRate = THREE.MathUtils.lerp(tuning.lowSpeedTurn, tuning.highSpeedTurn, speedRatio)
    * (drifting ? tuning.driftTurnMultiplier : 1)
  const directionSign = kinematics.speed >= 0 ? 1 : -1
  const targetYawRate = kinematics.steer * steeringRate * speedAuthority * directionSign
  kinematics.yawRate = THREE.MathUtils.damp(kinematics.yawRate, targetYawRate, tuning.yawResponse, step)
  kinematics.heading += kinematics.yawRate * step

  const lateralTarget = drifting
    ? kinematics.steer * absoluteSpeed * tuning.driftSlip
    : 0
  const grip = drifting ? tuning.driftGrip : tuning.normalGrip
  kinematics.lateralSpeed = THREE.MathUtils.damp(kinematics.lateralSpeed, lateralTarget, grip, step)

  return { boosting, drifting, steer: kinematics.steer, yawRate: kinematics.yawRate }
}
