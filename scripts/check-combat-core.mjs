import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { ENEMY_IDS, useGameStore } from '../src/store/useGameStore.js'

const state = () => useGameStore.getState()
state().setStatus('ready')
state().startProtocol('combat')

assert.equal(state().combatAction, 'locomotion')
assert.equal(state().combatEnergy, 100)
assert.equal(state().resolve, 0)
assert.equal(state().requestCombatAction('light'), true)
assert.equal(state().combatRequest.type, 'light')
assert.equal(state().combatRequestSerial, 1)

assert.equal(state().toggleLockOn(), true)
assert.ok(state().lockOnTargetId)

assert.equal(state().acquireAttackToken(ENEMY_IDS[0]), true)
assert.equal(state().acquireAttackToken(ENEMY_IDS[1]), true)
assert.equal(state().acquireAttackToken(ENEMY_IDS[2]), false)
assert.equal(state().attackTokens.length, 2)

const source = ENEMY_IDS[0]
const beforeHp = state().health
const beforeStagger = state().enemies.find((enemy) => enemy.id === source).staggerSerial
state().setBlockHeld(true)
const parryResult = state().damagePlayer(18, source)
assert.equal(parryResult, 'parried')
assert.equal(state().health, beforeHp)
assert.ok(state().resolve >= 28)
assert.ok(state().enemies.find((enemy) => enemy.id === source).staggerSerial > beforeStagger)

state().setBlockHeld(false)
state().setCombatRuntime({ dodgeUntil: performance.now() + 500 })
assert.equal(state().damagePlayer(18, ENEMY_IDS[1]), 'dodged')
assert.equal(state().health, beforeHp)

state().setCombatRuntime({ dodgeUntil: 0, resolve: 40 })
const target = state().enemies.find((enemy) => enemy.id === state().lockOnTargetId)
state().setPlayerTransform([target.position[0] - 1, 0.05, target.position[2]], 0)
state().damageEnemy(target.id, target.maxHp * 0.8, { ignoreArmor: true })
assert.equal(state().requestCombatAction('finisher'), true)

const director = fs.readFileSync(new URL('../src/game/combat/CombatDirector.jsx', import.meta.url), 'utf8')
const enemyUnit = fs.readFileSync(new URL('../src/game/enemies/EnemyUnit.jsx', import.meta.url), 'utf8')
const player = fs.readFileSync(new URL('../src/game/player/Player.jsx', import.meta.url), 'utf8')
for (const marker of ['light1', 'light2', 'light3', 'finisher', 'dodgeUntil', 'selectTargets']) assert.ok(director.includes(marker), `Missing combat director marker: ${marker}`)
for (const marker of ['acquireAttackToken', 'staggerUntil', 'unblockable', 'releaseAttackToken']) assert.ok(enemyUnit.includes(marker), `Missing enemy coordination marker: ${marker}`)
for (const marker of ['lockOnTargetId', 'combatDodgeVector', 'combatAction']) assert.ok(player.includes(marker), `Missing player combat marker: ${marker}`)

console.log('Phase 16 combat-core state, parry, dodge, finisher, lock-on, and enemy-token checks passed.')
