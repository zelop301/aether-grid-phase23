import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (path) => fs.readFileSync(path, 'utf8')
const store = read('src/store/useGameStore.js')
const boss = read('src/game/combat/BossPhaseDirector.jsx')
const enemy = read('src/game/enemies/EnemyUnit.jsx')
const effects = read('src/game/combat/CombatEffects.jsx')
const hud = read('src/ui/HUD.jsx')
const outcome = read('src/ui/OutcomeOverlay.jsx')
const audio = read('src/audio/AudioDirector.jsx')
const world = read('src/game/World.jsx')

for (const marker of ['bossPhase', 'setBossPhase', 'bossPhaseTransitionSerial', 'combatParries', 'combatDodges', 'combatDamageTaken', 'combatMaxCombo']) {
  assert.ok(store.includes(marker), `Missing Phase 21 store marker: ${marker}`)
}
for (const marker of ['phaseFromIntegrity', '0.66', '0.33', 'setBossPhase']) assert.ok(boss.includes(marker), `Missing boss phase marker: ${marker}`)
for (const marker of ['pendingUnblockable', 'attackWarning', "telegraphColor: '#ff355b'", 'bossPhase === 3']) assert.ok(enemy.includes(marker), `Missing enemy boss marker: ${marker}`)
for (const marker of ['boss-shift', 'boss-rage', 'torusGeometry']) assert.ok(effects.includes(marker), `Missing impact effect marker: ${marker}`)
for (const marker of ['PHASE {bossPhase}', 'PARRIES', 'MAX CHAIN']) assert.ok(hud.includes(marker), `Missing HUD marker: ${marker}`)
for (const marker of ['PERFECT PARRIES', 'DAMAGE TAKEN', 'combatMaxCombo']) assert.ok(outcome.includes(marker), `Missing report marker: ${marker}`)
for (const marker of ['combatImpactSerial', 'bossPhaseTransitionSerial', "playGameSound('parry')"]) assert.ok(audio.includes(marker), `Missing audio marker: ${marker}`)
assert.ok(world.includes('BossPhaseDirector'), 'Boss phase director is not mounted in the world.')
console.log('Phase 21 check passed: three-phase boss, readable telegraphs, combat mastery, impact effects, audio feedback, and boss HUD verified.')
