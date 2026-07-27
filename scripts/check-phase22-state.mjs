import assert from 'node:assert/strict'
import { useGameStore } from '../src/store/useGameStore.js'

const state = () => useGameStore.getState()
state().setStatus('ready')
state().startProtocol('combat')

useGameStore.setState({ attackTokens: [], attackTokenLimit: 1 })
assert.equal(state().acquireAttackToken('striker-01'), true)
assert.equal(state().acquireAttackToken('striker-02'), false)
state().releaseAttackToken('striker-01')
useGameStore.setState({ attackTokenLimit: 3 })
assert.equal(state().acquireAttackToken('striker-01'), true)
assert.equal(state().acquireAttackToken('striker-02'), true)
assert.equal(state().acquireAttackToken('disc-guard-01'), true)
assert.equal(state().acquireAttackToken('defender-01'), false)

const conduit = state().arenaConduits[0]
useGameStore.setState({
  status: 'running',
  storyModal: null,
  playerPosition: [...conduit.position],
  attackTokens: [],
  combatEnergy: 40,
  resolve: 0,
  conduitsTriggered: 0,
  enemies: state().enemies.map((enemy, index) => ({
    ...enemy,
    active: true,
    alive: true,
    hp: enemy.maxHp,
    position: index === 0 ? [conduit.position[0] + 1, 0.1, conduit.position[2] + 1] : [30 + index * 2, 0.1, 30],
  })),
})
const beforeHp = state().enemies[0].hp
assert.equal(state().activateNearbyConduit(), true)
assert.ok(state().enemies[0].hp < beforeHp)
assert.equal(state().arenaConduits[0].active, false)
assert.equal(state().conduitsTriggered, 1)
assert.ok(state().combatEnergy > 40)
assert.ok(state().resolve > 0)
assert.equal(state().activateNearbyConduit(), false)
state().rechargeArenaConduit(conduit.id)
assert.equal(state().arenaConduits[0].active, true)

state().setSquadRuntime({ squadTactic: 'surround', squadThreat: 63, attackTokenLimit: 2 })
assert.equal(state().squadTactic, 'surround')
assert.equal(state().squadThreat, 63)
assert.equal(state().attackTokenLimit, 2)
assert.ok(state().tacticSerial > 0)

console.log('Phase 22 state check passed: token limits, conduit overload/recharge, rewards, damage, and tactical runtime verified.')
