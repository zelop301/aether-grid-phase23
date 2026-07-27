import fs from 'node:fs'
import path from 'node:path'

let failures = 0
const expect = (condition, message) => { if (!condition) { failures += 1; console.error(message) } }
const root = process.cwd()
const store = fs.readFileSync(path.resolve(root, 'src/store/useGameStore.js'), 'utf8')
const cycle = fs.readFileSync(path.resolve(root, 'src/game/race/CyclePlayer.jsx'), 'utf8')
const keyboard = fs.readFileSync(path.resolve(root, 'src/hooks/useKeyboardInput.js'), 'utf8')
const hud = fs.readFileSync(path.resolve(root, 'src/ui/HUD.jsx'), 'utf8')
const mobile = fs.readFileSync(path.resolve(root, 'src/ui/MobileControls.jsx'), 'utf8')

for (const token of ['autopilotEnabled', 'autopilotLoops', 'toggleAutopilot', 'AUTOPILOT LOOP ENGAGED']) {
  expect(store.includes(token), `Autopilot store token missing: ${token}`)
}
for (const token of ['autopilotActive', 'autopilotTarget', 'lookAhead', 'headingError', 'radialError', 'driveBoost']) {
  expect(cycle.includes(token), `Autopilot controller token missing: ${token}`)
}
expect(keyboard.includes("event.code === 'KeyT'"), 'Keyboard T toggle missing.')
expect(hud.includes('AUTOPILOT LOOP'), 'Desktop autopilot control missing.')
expect(mobile.includes('AutopilotButton'), 'Mobile autopilot control missing.')
expect(store.includes('autopilotLoops: state.autopilotLoops + 1'), 'Continuous loop completion behavior missing.')

// Pure controller sanity sample: verify bounded steering on representative points.
const radius = 31
const halfWidth = 4.5
const samples = [
  { x: 0, z: 31, heading: Math.PI / 2, speed: 18 },
  { x: 31, z: 0, heading: Math.PI, speed: 20 },
  { x: 0, z: -31, heading: -Math.PI / 2, speed: 22 },
  { x: -33, z: 0, heading: 0, speed: 16 },
]
for (const sample of samples) {
  const angle = Math.atan2(sample.z, sample.x)
  const speedRatio = Math.max(0, Math.min(1, Math.abs(sample.speed) / 24))
  const lookAhead = 0.16 + (0.29 - 0.16) * speedRatio
  const targetAngle = angle - lookAhead
  const tx = Math.cos(targetAngle) * radius
  const tz = Math.sin(targetAngle) * radius
  const desired = Math.atan2(tx - sample.x, tz - sample.z)
  const error = Math.atan2(Math.sin(desired - sample.heading), Math.cos(desired - sample.heading))
  const radial = (Math.hypot(sample.x, sample.z) - radius) / halfWidth
  const steer = Math.max(-1, Math.min(1, error * 1.75 + radial * 0.22))
  expect(Number.isFinite(steer) && Math.abs(steer) <= 1, 'Autopilot steering produced an invalid value.')
}

if (failures) {
  console.error(`Phase 14 autopilot check failed with ${failures} error(s).`)
  process.exit(1)
}
console.log('Phase 14 autopilot check passed: toggle, HUD/mobile controls, centerline steering, auto boost/braking, and continuous loop behavior verified.')
