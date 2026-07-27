import assert from 'node:assert/strict'
import { VERTICAL_ESCAPE_CHECKPOINTS, useGameStore } from '../src/store/useGameStore.js'
import { createDefaultProfile } from '../src/core/progression.js'

const state = () => useGameStore.getState()
const profile = { ...createDefaultProfile(), xp: 1500, level: 4 }
useGameStore.setState({ status: 'ready', gameMode: null, profile, selectedDoctrine: 'balanced', activeRunModifier: 'standard' })

assert.equal(state().setSelectedDoctrine('velocity'), true)
assert.equal(state().selectedDoctrine, 'velocity')
assert.equal(state().setRunModifier('fragile'), true)
state().startProtocol('vertical')
assert.equal(state().maxHealth, 70)
assert.equal(state().health, 70)
assert.equal(state().missionRewards, null)

useGameStore.setState({
  verticalStage: 2,
  verticalMounted: true,
  verticalCheckpointIndex: 0,
  verticalMissionTime: 145,
  verticalTime: 29,
  health: 66,
  score: 9200,
  collisions: 1,
  combatParries: 4,
  combatDodges: 3,
  combatDamageTaken: 24,
  combatMaxCombo: 8,
  conduitsTriggered: 3,
})
for (let index = 0; index < VERTICAL_ESCAPE_CHECKPOINTS.length; index += 1) {
  assert.equal(state().passVerticalCheckpoint(index), true)
}
assert.equal(state().status, 'mission_complete')
assert.equal(state().missionRewards.rank, 'S')
assert.equal(state().missionRewards.modifierId, 'fragile')
assert.ok(state().missionRewards.fragmentsEarned > 0)
assert.equal(state().profile.runsCompleted, 1)
assert.equal(state().profile.bestRank, 'S')

state().returnToProtocolSelect()
useGameStore.setState({ profile: { ...state().profile, xp: 1500, level: 4 } })
assert.equal(state().setSelectedDoctrine('sentinel'), true)
assert.equal(state().setRunModifier('overdrive'), true)
state().startProtocol('combat')
assert.equal(state().maxHealth, 110)
assert.equal(state().attackTokenLimit, 3)
useGameStore.setState({ lastDamageAt: -1000 })
const before = state().health
assert.equal(state().damagePlayer(10), 'damaged')
assert.equal(before - state().health, 12)

state().returnToProtocolSelect()
assert.equal(state().setRunModifier('null-repair'), true)
state().startProtocol('vertical')
assert.ok(state().pickups.every((pickup) => pickup.active === false))

console.log('Phase 23 state check passed: doctrine unlocks, modifier rules, completion rewards, profile records, and disabled repairs verified.')
