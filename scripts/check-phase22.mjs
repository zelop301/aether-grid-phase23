import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(path, 'utf8')
const store = read('src/store/useGameStore.js')
const tactical = read('src/game/enemies/TacticalDirector.jsx')
const enemy = read('src/game/enemies/EnemyUnit.jsx')
const conduits = read('src/game/environment/AetherConduits.jsx')
const hud = read('src/ui/HUD.jsx')
const world = read('src/game/World.jsx')
const controls = read('src/hooks/useKeyboardInput.js')

for (const marker of ['ARENA_CONDUIT_BLUEPRINTS', 'attackTokenLimit', 'squadTactic', 'triggerArenaConduit', 'activateNearbyConduit', 'performCombatContextAction']) {
  assert.ok(store.includes(marker), `Missing Phase 22 store marker: ${marker}`)
}
for (const marker of ['chooseTactic', "'surround'", "'suppress'", "'hunt'", 'tokenLimit']) assert.ok(tactical.includes(marker), `Missing tactical marker: ${marker}`)
for (const marker of ['state.squadTactic', "tactic === 'surround'", "tactic === 'suppress'", 'tacticSpeed']) assert.ok(enemy.includes(marker), `Missing adaptive enemy marker: ${marker}`)
for (const marker of ['ARENA_CONDUIT_IDS', 'E // OVERLOAD', 'rechargeArenaConduit', 'readyAt']) assert.ok(conduits.includes(marker), `Missing conduit marker: ${marker}`)
for (const marker of ['TACTIC', 'THREAT', 'CONDUITS', 'OVERLOAD AN AETHER CONDUIT']) assert.ok(hud.includes(marker), `Missing HUD marker: ${marker}`)
assert.ok(world.includes('TacticalDirector'), 'TacticalDirector is not mounted.')
assert.ok(world.includes('AetherConduits'), 'AetherConduits are not mounted.')
assert.ok(controls.includes('performCombatContextAction'), 'Keyboard context action is not wired.')
console.log('Phase 22 check passed: adaptive tactics, dynamic attack channels, Aether Conduits, contextual controls, and tactical HUD verified.')
