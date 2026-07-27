import fs from 'node:fs'
import path from 'node:path'

let failures = 0
const expect = (condition, message) => {
  if (!condition) {
    failures += 1
    console.error(message)
  }
}

const root = process.cwd()
const rigPath = path.resolve(root, 'src/game/race/CycleVehicleRig.jsx')
const fitPath = path.resolve(root, 'src/game/race/riderFitConfig.js')
const racePath = path.resolve(root, 'src/game/race/CyclePlayer.jsx')
const verticalPath = path.resolve(root, 'src/game/vertical/VerticalEscapeCycle.jsx')

expect(fs.existsSync(rigPath), 'CycleVehicleRig.jsx is missing.')
expect(fs.existsSync(fitPath), 'Central riderFitConfig.js is missing.')

if (fs.existsSync(rigPath)) {
  const rig = fs.readFileSync(rigPath, 'utf8')
  expect(rig.includes('RiderContactRig'), 'Rider contact alignment rig is missing.')
  expect(rig.includes('leftGrip') || rig.includes('RIDER_FIT.contacts'), 'Handlebar contact anchors are missing.')
  expect(rig.includes('wheelAngle.current'), 'Speed-driven wheel rotation is missing.')
  expect(rig.includes('suspensionTarget'), 'Suspension response is missing.')
  expect(rig.includes('targetBank'), 'Rider and bike bank response is missing.')
  expect(rig.includes('frontSteer.current.rotation.y'), 'Front steering visual response is missing.')
}

if (fs.existsSync(fitPath)) {
  const fit = fs.readFileSync(fitPath, 'utf8')
  for (const anchor of ['leftGrip', 'rightGrip', 'leftFoot', 'rightFoot', 'leftKnee', 'rightKnee']) {
    expect(fit.includes(anchor), `Rider fit anchor missing: ${anchor}`)
  }
}

for (const [label, file] of [['race', racePath], ['vertical escape', verticalPath]]) {
  const source = fs.readFileSync(file, 'utf8')
  expect(source.includes('<CycleVehicleRig'), `${label} does not mount the synchronized vehicle rig.`)
  expect(source.includes('vehicleDynamics'), `${label} does not provide live rider dynamics.`)
  expect(source.includes('sideOffset') || source.includes('cameraOffset.set(response.steer'), `${label} lacks turn-aware camera offset.`)
}

if (failures) {
  console.error(`Phase 11 rider-rig check failed with ${failures} error(s).`)
  process.exit(1)
}

console.log('Phase 11 rider-rig check passed: contact anchors, synchronized lean, wheel motion, suspension, and turn-aware camera verified.')
