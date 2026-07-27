import fs from 'node:fs'
import assert from 'node:assert/strict'
const read = (path) => fs.readFileSync(path, 'utf8')
const store = read('src/store/useGameStore.js')
const director = read('src/game/vertical/VerticalSliceDirector.jsx')
const hud = read('src/ui/HUD.jsx')
const world = read('src/game/World.jsx')
for (const marker of ['verticalWave', 'advanceVerticalWave', 'verticalMissionTime', 'wave: 3', 'maxHp: 220']) assert.ok(store.includes(marker), `Missing Phase 20 store marker: ${marker}`)
for (const marker of ['activeAlive', 'advanceVerticalWave', 'setVerticalMissionTime']) assert.ok(director.includes(marker), `Missing director marker: ${marker}`)
assert.ok(hud.includes('GRID WARDEN'), 'Mini-boss HUD missing.')
assert.ok(hud.includes('MISSION'), 'Campaign timer missing.')
assert.ok(world.includes('GenesisBreachEnvironment'), 'Campaign environment layer missing.')
console.log('Phase 20 check passed: paced waves, mini-boss, mission timing, HUD, and campaign environment verified.')
