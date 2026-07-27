import assert from 'node:assert/strict'
import { useGameStore } from '../src/store/useGameStore.js'

const state = () => useGameStore.getState()
state().setStatus('ready')
state().startProtocol('vertical')

useGameStore.setState({
  status: 'running',
  gameMode: 'vertical',
  verticalStage: 1,
  verticalWave: 3,
  bossPhase: 1,
  storyModal: null,
  enemies: state().enemies.map((enemy) => ({
    ...enemy,
    active: enemy.id === 'commander-01',
    alive: enemy.id === 'commander-01',
    hp: enemy.id === 'commander-01' ? enemy.maxHp : 0,
  })),
})

assert.equal(state().setBossPhase(2), true)
assert.equal(state().bossPhase, 2)
assert.equal(state().bossPhaseTransitionSerial, 1)
assert.ok(state().enemies.find((enemy) => enemy.id === 'commander-01').staggerSerial > 0)
assert.equal(state().setBossPhase(2), false)
assert.equal(state().setBossPhase(3), true)
assert.equal(state().bossPhase, 3)

useGameStore.setState({
  blockHeld: true,
  parryUntil: performance.now() + 300,
  dodgeUntil: 0,
  combatParries: 0,
  combatDodges: 0,
  combatDamageTaken: 0,
})
assert.equal(state().damagePlayer(12, 'commander-01'), 'parried')
assert.equal(state().combatParries, 1)

useGameStore.setState({ blockHeld: false, dodgeUntil: performance.now() + 300 })
assert.equal(state().damagePlayer(12, 'commander-01'), 'dodged')
assert.equal(state().combatDodges, 1)

useGameStore.setState({ dodgeUntil: 0, lastDamageAt: -10000 })
assert.equal(state().damagePlayer(12, 'commander-01'), 'damaged')
assert.ok(state().combatDamageTaken > 0)

console.log('Phase 21 state check passed: boss transitions and combat mastery counters verified.')
