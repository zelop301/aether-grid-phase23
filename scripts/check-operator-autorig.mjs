import fs from 'node:fs'

const autoRig = fs.readFileSync('src/game/player/AutoRigOperator.jsx', 'utf8')
const motionRig = fs.readFileSync('src/game/player/OperatorMotionRig.jsx', 'utf8')

const required = [
  'new THREE.SkinnedMesh',
  "geometry.setAttribute('skinIndex'",
  "geometry.setAttribute('skinWeight'",
  "leftUpperArm",
  "rightUpperArm",
  "leftUpperLeg",
  "rightUpperLeg",
]

for (const marker of required) {
  if (!autoRig.includes(marker)) {
    console.error(`Missing auto-rig marker: ${marker}`)
    process.exit(1)
  }
}

if (motionRig.includes('capsuleGeometry') || motionRig.includes('MotionLimb')) {
  console.error('Visible helper-stick limbs still exist in OperatorMotionRig.')
  process.exit(1)
}

if (!motionRig.includes('AutoRigOperator')) {
  console.error('OperatorMotionRig is not using the auto-rigged hero mesh.')
  process.exit(1)
}

console.log('Operator auto-rig check passed: hero mesh is skinned and helper-stick limbs are removed.')
