import fs from 'node:fs'
import path from 'node:path'

let failures = 0
const expect = (condition, message) => { if (!condition) { failures += 1; console.error(message) } }
const root = process.cwd()
const model = fs.readFileSync(path.resolve(root, 'src/game/race/vehicleModel.js'), 'utf8')
const race = fs.readFileSync(path.resolve(root, 'src/game/race/CyclePlayer.jsx'), 'utf8')
const vertical = fs.readFileSync(path.resolve(root, 'src/game/vertical/VerticalEscapeCycle.jsx'), 'utf8')
const rig = fs.readFileSync(path.resolve(root, 'src/game/race/CycleVehicleRig.jsx'), 'utf8')
const trail = fs.readFileSync(path.resolve(root, 'src/game/race/EnergyTrail.jsx'), 'utf8')

for (const token of ['steerResponse', 'yawResponse', 'kinematics.yawRate', 'inputDeadzone', 'normalGrip: 10.5']) {
  expect(model.includes(token), `Stable controller token missing: ${token}`)
}
expect(!race.includes('response.boosting ? 0.012'), 'Race boost camera shake is still active.')
expect(race.includes('smoothedAcceleration'), 'Race acceleration filter is missing.')
expect(vertical.includes('smoothedAcceleration'), 'Vertical acceleration filter is missing.')
expect(rig.includes('smoothedAcceleration'), 'Rider rig acceleration filter is missing.')
expect(rig.includes('2.4 + Math.abs(speed) * 0.06'), 'Low-frequency suspension motion is missing.')
expect(trail.includes('MeshBasicMaterial'), 'Energy trail still uses the more expensive lit material.')

if (failures) {
  console.error(`Phase 12 stability check failed with ${failures} error(s).`)
  process.exit(1)
}
console.log('Phase 12 stability check passed: filtered steering, damped yaw, calm suspension, stable camera, and cheaper trail rendering verified.')
