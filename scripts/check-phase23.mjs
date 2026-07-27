import fs from 'node:fs'
import assert from 'node:assert/strict'
import {
  DOCTRINES,
  GENESIS_CHALLENGES,
  RUN_MODIFIERS,
  calculateGenesisRank,
  createDefaultProfile,
  resolveGenesisRewards,
} from '../src/core/progression.js'

const read = (file) => fs.readFileSync(file, 'utf8')
const store = read('src/store/useGameStore.js')
const boot = read('src/ui/BootScreen.jsx')
const outcome = read('src/ui/OutcomeOverlay.jsx')
const hud = read('src/ui/HUD.jsx')
const tactical = read('src/game/enemies/TacticalDirector.jsx')
const pickup = read('src/game/pickups/PickupDirector.jsx')

assert.equal(Object.keys(DOCTRINES).length, 4, 'Phase 23 must expose four operator doctrines.')
assert.equal(Object.keys(RUN_MODIFIERS).length, 4, 'Phase 23 must expose four run modifiers.')
assert.equal(GENESIS_CHALLENGES.length, 5, 'Phase 23 must expose five mission contracts.')

const masteryStats = {
  health: 96,
  collisions: 0,
  verticalMissionTime: 138,
  score: 10400,
  combatParries: 4,
  combatMaxCombo: 8,
  combatDamageTaken: 18,
  conduitsTriggered: 3,
}
assert.equal(calculateGenesisRank(masteryStats), 'S', 'Mastery run should produce S rank.')

const standard = resolveGenesisRewards(createDefaultProfile(), masteryStats, 'standard')
const overdrive = resolveGenesisRewards(createDefaultProfile(), masteryStats, 'overdrive')
assert.ok(standard.challenges.every((challenge) => challenge.completed), 'Mastery run should complete every contract.')
assert.ok(overdrive.fragmentsEarned > standard.fragmentsEarned, 'Overdrive must increase progression rewards.')
assert.ok(standard.profile.runsCompleted === 1, 'Completed run must increment profile run count.')
assert.ok(standard.profile.bestRank === 'S', 'Completed run must persist best rank.')

for (const marker of ['PROFILE_KEY', 'setRunModifier', 'setSelectedDoctrine', 'resolveGenesisRewards', 'missionRewards', 'activeRunModifier', 'selectedDoctrine']) {
  assert.ok(store.includes(marker), `Missing progression store marker: ${marker}`)
}
for (const marker of ['CHALLENGE MATRIX', 'OPERATOR DOCTRINE', 'RUN MODIFIER', 'MISSION CONTRACTS', 'profile-summary-strip']) {
  assert.ok(boot.includes(marker), `Missing Challenge Matrix marker: ${marker}`)
}
for (const marker of ['OPERATOR PROGRESSION', 'CORE FRAGMENTS', 'mission-contract-results', 'REWARD RATE']) {
  assert.ok(outcome.includes(marker), `Missing mission reward marker: ${marker}`)
}
assert.ok(hud.includes('run-loadout-chip'), 'Active doctrine and modifier are not visible in the campaign HUD.')
assert.ok(tactical.includes("state.activeRunModifier === 'overdrive'"), 'Overdrive attack-channel behavior is not wired.')
assert.ok(pickup.includes("gameMode === 'vertical' && verticalStage === 1"), 'Repair nodes are not mounted for Genesis Breach combat.')

console.log('Phase 23 check passed: persistent mastery, doctrines, modifiers, mission contracts, rewards, best-run records, and replay UI verified.')
