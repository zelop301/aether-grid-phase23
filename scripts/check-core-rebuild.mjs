import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const boot = read('src/ui/BootScreen.jsx')
const hud = read('src/ui/HUD.jsx')
const store = read('src/store/useGameStore.js')
const registry = read('src/core/assetRegistry.ts')
const preload = read('src/core/preloadCoreAssets.ts')
const playerSource = read('src/game/player/rapidPunchingSource.js')

for (const marker of ['NEW GAME', 'GENESIS BREACH', 'MISSION SELECT', 'ARENA', 'VELOCITY TRIAL', 'SETTINGS & ACCESSIBILITY']) {
  assert.ok(boot.includes(marker), `Missing player menu marker: ${marker}`)
}
for (const forbidden of ['PHASE 19', 'NEW VERTICAL SLICE', 'PROJECT SHOWCASE']) {
  assert.equal(boot.includes(forbidden), false, `Development-facing menu label remains: ${forbidden}`)
}
for (const marker of ['cipher-runner.glb', 'flux-cycle.glb', 'warden-runtime.glb', 'collision', 'preload', 'lod']) {
  assert.ok(registry.includes(marker), `Asset registry marker missing: ${marker}`)
}
assert.ok(preload.includes('response.body.getReader'), 'Critical loading is not using real byte progress.')
assert.ok(store.includes("aether-grid-checkpoint-v3"), 'Checkpoint namespace was not migrated.')
assert.ok(store.includes('version !== 3'), 'Checkpoint version validation was not migrated.')
assert.ok(hud.includes('CAMPAIGN // GENESIS BREACH'), 'Campaign HUD identity missing.')
assert.equal(playerSource.includes('FBXLoader'), false, 'Source FBX loader remains in the lean player build.')
assert.ok(playerSource.includes('createProceduralSource'), 'Production rapid-strike fallback missing.')

console.log('Core rebuild check passed: campaign-first menu, original runtime naming, real loading progress, v3 checkpoints, typed asset registry, and lean animation runtime verified.')
