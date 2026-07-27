import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MODEL_URLS } from '../assets/ImportedAssets.jsx'
import { loadRapidPunchingSource } from './rapidPunchingSource.js'

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1)
const damp = (current, target, smoothing, delta) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta))

function cloneMaterial(material, accent) {
  const tune = (item) => {
    const clone = item.clone()
    if ('metalness' in clone) clone.metalness = Math.max(clone.metalness ?? 0, 0.58)
    if ('roughness' in clone) clone.roughness = Math.min(clone.roughness ?? 1, 0.42)
    if ('envMapIntensity' in clone) clone.envMapIntensity = 1.15
    if ('emissive' in clone) {
      const luminance = clone.emissive.r + clone.emissive.g + clone.emissive.b
      if (luminance > 0.04) {
        clone.emissive.set(accent)
        clone.emissiveIntensity = Math.max(clone.emissiveIntensity ?? 1, 1.45)
      }
    }
    clone.needsUpdate = true
    return clone
  }
  return Array.isArray(material) ? material.map(tune) : tune(material)
}

function addInfluence(indices, weights, vertex, slot, bone, weight) {
  indices[vertex * 4 + slot] = bone
  weights[vertex * 4 + slot] = weight
}

function createAutoRig(scene, shadows, accent) {
  const source = scene.clone(true)
  source.updateMatrixWorld(true)
  let sourceMesh = null
  source.traverse((object) => {
    if (!sourceMesh && object.isMesh) sourceMesh = object
  })
  if (!sourceMesh) throw new Error('Operator model does not contain a mesh.')

  const geometry = sourceMesh.geometry.clone()
  geometry.applyMatrix4(sourceMesh.matrixWorld)
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  const centerX = (bounds.min.x + bounds.max.x) * 0.5
  const centerZ = (bounds.min.z + bounds.max.z) * 0.5
  geometry.translate(-centerX, -bounds.min.y, -centerZ)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  if (geometry.boundingSphere) geometry.boundingSphere.radius *= 1.35

  const height = geometry.boundingBox.max.y
  const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x
  const hipsY = height * 0.39
  const spineY = height * 0.54
  const chestY = height * 0.69
  const neckY = height * 0.82
  const shoulderX = width * 0.19
  const elbowX = width * 0.38
  const hipX = width * 0.105

  const root = new THREE.Bone()
  root.name = 'AutoRoot'
  const hips = new THREE.Bone()
  hips.name = 'AutoHips'
  hips.position.set(0, hipsY, 0)
  root.add(hips)

  const spine = new THREE.Bone()
  spine.name = 'AutoSpine'
  spine.position.set(0, spineY - hipsY, 0)
  hips.add(spine)

  const chest = new THREE.Bone()
  chest.name = 'AutoChest'
  chest.position.set(0, chestY - spineY, 0)
  spine.add(chest)

  const head = new THREE.Bone()
  head.name = 'AutoHead'
  head.position.set(0, neckY - chestY, 0)
  chest.add(head)

  const leftUpperArm = new THREE.Bone()
  leftUpperArm.name = 'AutoLeftUpperArm'
  leftUpperArm.position.set(-shoulderX, height * 0.055, 0)
  chest.add(leftUpperArm)
  const leftLowerArm = new THREE.Bone()
  leftLowerArm.name = 'AutoLeftLowerArm'
  leftLowerArm.position.set(-width * 0.22, -height * 0.075, 0)
  leftUpperArm.add(leftLowerArm)

  const rightUpperArm = new THREE.Bone()
  rightUpperArm.name = 'AutoRightUpperArm'
  rightUpperArm.position.set(shoulderX, height * 0.055, 0)
  chest.add(rightUpperArm)
  const rightLowerArm = new THREE.Bone()
  rightLowerArm.name = 'AutoRightLowerArm'
  rightLowerArm.position.set(width * 0.22, -height * 0.075, 0)
  rightUpperArm.add(rightLowerArm)

  const leftUpperLeg = new THREE.Bone()
  leftUpperLeg.name = 'AutoLeftUpperLeg'
  leftUpperLeg.position.set(-hipX, -height * 0.035, 0)
  hips.add(leftUpperLeg)
  const leftLowerLeg = new THREE.Bone()
  leftLowerLeg.name = 'AutoLeftLowerLeg'
  leftLowerLeg.position.set(0, -height * 0.205, 0)
  leftUpperLeg.add(leftLowerLeg)

  const rightUpperLeg = new THREE.Bone()
  rightUpperLeg.name = 'AutoRightUpperLeg'
  rightUpperLeg.position.set(hipX, -height * 0.035, 0)
  hips.add(rightUpperLeg)
  const rightLowerLeg = new THREE.Bone()
  rightLowerLeg.name = 'AutoRightLowerLeg'
  rightLowerLeg.position.set(0, -height * 0.205, 0)
  rightUpperLeg.add(rightLowerLeg)

  const bones = [
    root,
    hips,
    spine,
    chest,
    head,
    leftUpperArm,
    leftLowerArm,
    rightUpperArm,
    rightLowerArm,
    leftUpperLeg,
    leftLowerLeg,
    rightUpperLeg,
    rightLowerLeg,
  ]

  const position = geometry.attributes.position
  const skinIndices = new Uint16Array(position.count * 4)
  const skinWeights = new Float32Array(position.count * 4)
  const shoulderThreshold = width * 0.18
  const elbowThreshold = width * 0.37
  const kneeY = height * 0.205

  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const x = position.getX(vertex)
    const y = position.getY(vertex)
    const absX = Math.abs(x)

    if (y > neckY) {
      addInfluence(skinIndices, skinWeights, vertex, 0, 4, 1)
      continue
    }

    const isArm = y > height * 0.43 && absX > shoulderThreshold
    if (isArm) {
      const upperBone = x < 0 ? 5 : 7
      const lowerBone = x < 0 ? 6 : 8
      const lowerBlend = clamp01((absX - shoulderThreshold) / Math.max(1, elbowThreshold - shoulderThreshold))
      addInfluence(skinIndices, skinWeights, vertex, 0, upperBone, 1 - lowerBlend)
      addInfluence(skinIndices, skinWeights, vertex, 1, lowerBone, lowerBlend)
      continue
    }

    if (y < hipsY) {
      const upperBone = x < 0 ? 9 : 11
      const lowerBone = x < 0 ? 10 : 12
      const lowerBlend = clamp01((kneeY - y) / Math.max(1, height * 0.12))
      addInfluence(skinIndices, skinWeights, vertex, 0, upperBone, 1 - lowerBlend)
      addInfluence(skinIndices, skinWeights, vertex, 1, lowerBone, lowerBlend)
      continue
    }

    if (y < spineY) {
      const spineBlend = clamp01((y - hipsY) / Math.max(1, spineY - hipsY))
      addInfluence(skinIndices, skinWeights, vertex, 0, 1, 1 - spineBlend)
      addInfluence(skinIndices, skinWeights, vertex, 1, 2, spineBlend)
      continue
    }

    if (y < chestY) {
      const chestBlend = clamp01((y - spineY) / Math.max(1, chestY - spineY))
      addInfluence(skinIndices, skinWeights, vertex, 0, 2, 1 - chestBlend)
      addInfluence(skinIndices, skinWeights, vertex, 1, 3, chestBlend)
      continue
    }

    const headBlend = clamp01((y - chestY) / Math.max(1, neckY - chestY))
    addInfluence(skinIndices, skinWeights, vertex, 0, 3, 1 - headBlend)
    addInfluence(skinIndices, skinWeights, vertex, 1, 4, headBlend)
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

  const material = cloneMaterial(sourceMesh.material, accent)
  const mesh = new THREE.SkinnedMesh(geometry, material)
  mesh.name = 'AutoRiggedOperator'
  mesh.castShadow = shadows
  mesh.receiveShadow = shadows
  mesh.frustumCulled = false
  mesh.add(root)
  const skeleton = new THREE.Skeleton(bones)
  mesh.bind(skeleton)
  mesh.normalizeSkinWeights()

  return {
    mesh,
    bones: {
      root,
      hips,
      spine,
      chest,
      head,
      leftUpperArm,
      leftLowerArm,
      rightUpperArm,
      rightLowerArm,
      leftUpperLeg,
      leftLowerLeg,
      rightUpperLeg,
      rightLowerLeg,
    },
  }
}

function setRotation(bone, x, y, z, smoothing, delta) {
  bone.rotation.x = damp(bone.rotation.x, x, smoothing, delta)
  bone.rotation.y = damp(bone.rotation.y, y, smoothing, delta)
  bone.rotation.z = damp(bone.rotation.z, z, smoothing, delta)
}

export default function AutoRigOperator({ shadows = true, motionRef, accent = '#73f5ff' }) {
  const { scene } = useGLTF(MODEL_URLS.operator)
  const rig = useMemo(() => createAutoRig(scene, shadows, accent), [scene, shadows, accent])
  const rapidSource = useRef(null)
  const rapidLoadStarted = useRef(false)
  const observedRapidSerial = useRef(-1)

  useFrame(({ clock }, delta) => {
    const motion = motionRef?.current || {}
    const bones = rig.bones
    const move = motion.moveBlend || 0
    const sprint = motion.sprintBlend || 0
    const strafe = motion.strafe || 0
    const forward = motion.forward || 0
    const attack = motion.attack || 0
    const damage = motion.damage || 0
    const action = motion.combatAction || 'locomotion'
    const phaseName = motion.combatPhase || 'idle'
    const comboStep = motion.comboStep || 0
    const blocking = Boolean(motion.block)
    const actionSerial = motion.actionSerial || 0
    const locomotionPhase = motion.phase || clock.elapsedTime * 6
    const stride = Math.sin(locomotionPhase)
    const strideAmount = move * (0.62 + sprint * 0.34)
    const active = phaseName === 'active' ? 1 : phaseName === 'startup' ? 0.58 : phaseName === 'recovery' ? 0.3 : 0
    const light = action.startsWith('light')
    const heavy = action === 'heavy' || action === 'finisher'
    const rapid = action === 'rapid'
    const slam = action === 'slam'
    const nova = action === 'nova'
    const dodge = action === 'dodge'

    if (rapid && !rapidLoadStarted.current) {
      rapidLoadStarted.current = true
      loadRapidPunchingSource()
        .then((source) => { rapidSource.current = source })
        .catch(() => { rapidSource.current = null })
    }
    if (rapid && rapidSource.current && observedRapidSerial.current !== actionSerial) {
      observedRapidSerial.current = actionSerial
      rapidSource.current.restart()
    }

    const sourcePunch = rapid && rapidSource.current ? rapidSource.current.sample(delta * 1.18) : null
    const fallbackWave = Math.sin(clock.elapsedTime * 42)
    const rapidLeft = rapid ? (sourcePunch ? sourcePunch.left : Math.max(0, -fallbackWave)) : 0
    const rapidRight = rapid ? (sourcePunch ? sourcePunch.right : Math.max(0, fallbackWave)) : 0
    const rapidTwist = rapid ? (sourcePunch?.twist ?? fallbackWave * 0.32) : 0
    const attackSide = comboStep === 2 ? -1 : 1
    const strike = Math.max(attack, (light || heavy || rapid || slam || nova) ? active : 0)

    bones.root.position.y = damp(
      bones.root.position.y,
      Math.abs(stride) * move * 12 - (dodge ? active * 34 : 0) - (slam ? active * 16 : 0),
      10,
      delta,
    )
    setRotation(
      bones.hips,
      -forward * 0.08 - sprint * 0.04 - (dodge ? active * 0.25 : 0) + (slam ? active * 0.18 : 0),
      strafe * 0.08 + rapidTwist * 0.08,
      -strafe * 0.1,
      9,
      delta,
    )
    setRotation(
      bones.spine,
      -forward * 0.12 - sprint * 0.07 - (heavy ? active * 0.2 : slam ? active * 0.18 : nova ? active * 0.11 : light ? active * 0.08 : rapid ? active * 0.06 : 0) + damage * 0.12,
      attackSide * strike * 0.18 + rapidTwist * active * 0.22,
      -strafe * 0.08 + attackSide * strike * 0.05,
      10,
      delta,
    )
    setRotation(
      bones.chest,
      blocking ? -0.08 : -forward * 0.07 - (slam ? active * 0.12 : 0),
      attackSide * strike * 0.24 + rapidTwist * active * 0.3,
      -strafe * 0.06 + attackSide * strike * 0.08,
      11,
      delta,
    )
    setRotation(bones.head, damage * -0.12, -attackSide * strike * 0.08 - rapidTwist * 0.04, strafe * 0.025, 10, delta)

    const leftSwing = stride * strideAmount
    const rightSwing = -stride * strideAmount
    const leftStrike = rapid
      ? rapidLeft * active
      : light && attackSide < 0
        ? strike
        : slam
          ? strike * 0.95
          : nova
            ? strike * 0.38
            : heavy
              ? strike * 0.72
              : 0
    const rightStrike = rapid
      ? rapidRight * active
      : light && attackSide > 0
        ? strike
        : slam
          ? strike * 0.95
          : nova
            ? strike * 0.38
            : heavy
              ? strike
              : attack

    setRotation(
      bones.leftUpperArm,
      blocking ? -0.92 : (nova ? -0.38 : leftSwing * 0.72) - leftStrike * (rapid ? 1.35 : slam ? 1.18 : 1.05),
      blocking ? -0.38 : nova ? -0.8 * active : -leftStrike * 0.22,
      blocking ? -0.42 : nova ? -0.55 * active : -0.04 - leftStrike * 0.18,
      rapid ? 18 : 13,
      delta,
    )
    setRotation(
      bones.leftLowerArm,
      blocking ? -0.58 : -Math.max(0, -leftSwing) * 0.45 - leftStrike * (rapid ? 0.82 : 0.48),
      blocking ? -0.25 : nova ? -0.12 * active : 0,
      blocking ? 0.12 : nova ? -0.1 * active : -leftStrike * 0.12,
      rapid ? 19 : 13,
      delta,
    )
    setRotation(
      bones.rightUpperArm,
      blocking ? -0.92 : (nova ? -0.38 : rightSwing * 0.72) - rightStrike * (rapid ? 1.35 : slam ? 1.18 : 1.18),
      blocking ? 0.38 : nova ? 0.8 * active : rightStrike * 0.26,
      blocking ? 0.42 : nova ? 0.55 * active : 0.04 + rightStrike * 0.2,
      rapid ? 18 : 13,
      delta,
    )
    setRotation(
      bones.rightLowerArm,
      blocking ? -0.58 : -Math.max(0, -rightSwing) * 0.45 - rightStrike * (rapid ? 0.82 : 0.55),
      blocking ? 0.25 : nova ? 0.12 * active : 0,
      blocking ? -0.12 : nova ? 0.1 * active : rightStrike * 0.14,
      rapid ? 19 : 13,
      delta,
    )

    const dodgeLeg = dodge ? active * 0.65 : 0
    const brace = slam ? active * 0.24 : nova ? active * 0.14 : 0
    setRotation(bones.leftUpperLeg, -stride * strideAmount * 0.8 + dodgeLeg + brace, 0, -strafe * 0.08, 12, delta)
    setRotation(bones.leftLowerLeg, Math.max(0, stride) * strideAmount * 0.62 + dodgeLeg * 0.5 + brace * 0.22, 0, 0, 12, delta)
    setRotation(bones.rightUpperLeg, stride * strideAmount * 0.8 + dodgeLeg + brace, 0, -strafe * 0.08, 12, delta)
    setRotation(bones.rightLowerLeg, Math.max(0, -stride) * strideAmount * 0.62 + dodgeLeg * 0.5 + brace * 0.22, 0, 0, 12, delta)
  })

  return <primitive object={rig.mesh} scale={0.00246} position={[0, 0.02, 0]} />
}
