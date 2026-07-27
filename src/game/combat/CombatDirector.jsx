import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const ATTACKS = {
  light1: { startup: 0.11, active: 0.11, recovery: 0.2, damage: 17, range: 3.15, arc: 0.2, stagger: 280 },
  light2: { startup: 0.1, active: 0.12, recovery: 0.2, damage: 20, range: 3.25, arc: 0.08, stagger: 340 },
  light3: { startup: 0.14, active: 0.14, recovery: 0.32, damage: 29, range: 3.5, arc: -0.08, stagger: 620, heavy: true, cleave: 2 },
  heavy: { startup: 0.3, active: 0.16, recovery: 0.46, damage: 44, range: 3.75, arc: -0.15, stagger: 820, heavy: true, cleave: 2, energy: 18 },
  rapid: { startup: 0.09, active: 0.6, recovery: 0.34, damage: 7, range: 3.2, arc: -0.08, stagger: 150, cleave: 1, energy: 24, multiHits: 8, hitInterval: 0.07, variant: 'rapid' },
  slam: { startup: 0.24, active: 0.2, recovery: 0.44, damage: 46, range: 4.2, arc: -1, stagger: 920, heavy: true, cleave: 4, energy: 30, variant: 'orange' },
  nova: { startup: 0.28, active: 0.24, recovery: 0.54, damage: 31, range: 5.3, arc: -1, stagger: 760, heavy: true, cleave: 6, energy: 38, variant: 'violet' },
  finisher: { startup: 0.24, active: 0.18, recovery: 0.52, damage: 999, range: 3.35, arc: -1, stagger: 1000, heavy: true, finisher: true },
  dodge: { startup: 0.05, active: 0.24, recovery: 0.18 },
}

const player = new THREE.Vector3()
const enemyPosition = new THREE.Vector3()
const forward = new THREE.Vector3()
const toEnemy = new THREE.Vector3()

function isCombatActive(state) {
  return state.gameMode === 'combat'
    || (state.gameMode === 'story' && state.storyStage === 2)
    || (state.gameMode === 'vertical' && state.verticalStage === 1)
}

function selectTargets(state, profile) {
  player.fromArray(state.playerPosition)
  forward.set(Math.sin(state.playerHeading), 0, Math.cos(state.playerHeading)).normalize()
  const candidates = []

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.active === false) continue
    enemyPosition.fromArray(enemy.position)
    toEnemy.copy(enemyPosition).sub(player)
    toEnemy.y = 0
    const distance = toEnemy.length()
    if (distance > profile.range || distance < 0.001) continue
    toEnemy.normalize()
    const alignment = forward.dot(toEnemy)
    const locked = enemy.id === state.lockOnTargetId
    if (!locked && alignment < profile.arc) continue
    candidates.push({ enemy, distance, alignment, locked })
  }

  candidates.sort((a, b) => Number(b.locked) - Number(a.locked) || b.alignment - a.alignment || a.distance - b.distance)
  return candidates.slice(0, profile.cleave || 1).map((candidate) => candidate.enemy)
}

export default function CombatDirector() {
  const observedRequest = useRef(0)
  const current = useRef(null)
  const phase = useRef('idle')
  const phaseTimer = useRef(0)
  const queued = useRef(null)
  const comboStep = useRef(0)
  const comboExpireAt = useRef(0)
  const hitApplied = useRef(false)
  const regenTimer = useRef(0)
  const observedResetNonce = useRef(-1)
  const multiHitTimer = useRef(0)
  const multiHitsApplied = useRef(0)

  const startAction = (type, state) => {
    let action = type
    if (type === 'light') {
      comboStep.current = performance.now() < comboExpireAt.current ? (comboStep.current % 3) + 1 : 1
      action = `light${comboStep.current}`
      comboExpireAt.current = performance.now() + 720
    } else if (type !== 'dodge') {
      comboStep.current = 0
    }

    const profile = ATTACKS[action]
    if (!profile) return
    if (profile.energy && state.combatEnergy < profile.energy) return

    const runtimePatch = {}
    if (profile.energy) runtimePatch.combatEnergy = Math.max(0, state.combatEnergy - profile.energy)
    if (type === 'finisher') runtimePatch.resolve = Math.max(0, state.resolve - 25)

    const dodgeVector = [
      Number(state.input.right) - Number(state.input.left),
      Number(state.input.backward) - Number(state.input.forward),
    ]
    if (type === 'dodge' && Math.abs(dodgeVector[0]) + Math.abs(dodgeVector[1]) < 0.1) dodgeVector[1] = 1

    current.current = action
    phase.current = 'startup'
    phaseTimer.current = profile.startup
    hitApplied.current = false
    queued.current = null
    multiHitTimer.current = 0
    multiHitsApplied.current = 0

    useGameStore.getState().setCombatRuntime({
      ...runtimePatch,
      combatAction: action,
      combatPhase: 'startup',
      combatActionSerial: state.combatActionSerial + 1,
      combatComboStep: comboStep.current,
      combatDodgeVector: dodgeVector,
      dodgeUntil: type === 'dodge' ? performance.now() + 320 : state.dodgeUntil,
      blockHeld: false,
      parryUntil: 0,
      combatMessage: type === 'finisher'
        ? 'EXECUTION LINK'
        : type === 'rapid'
          ? 'RAPID PUNCHING'
          : type === 'slam'
            ? 'ARC SLAM'
            : type === 'nova'
              ? 'NOVA PULSE'
              : null,
      combatMessageUntil: ['finisher', 'rapid', 'slam', 'nova'].includes(type) ? performance.now() + 700 : 0,
    })
  }

  const finishAction = () => {
    current.current = null
    phase.current = 'idle'
    phaseTimer.current = 0
    hitApplied.current = false
    multiHitTimer.current = 0
    multiHitsApplied.current = 0
    const state = useGameStore.getState()
    state.setCombatRuntime({
      combatAction: state.blockHeld ? 'block' : 'locomotion',
      combatPhase: state.blockHeld ? 'hold' : 'idle',
      combatComboStep: comboStep.current,
    })
  }

  const applyHit = (state, target, profile) => {
    const hit = state.damageEnemy(target.id, profile.damage, {
      heavy: profile.heavy,
      finisher: profile.finisher,
      ignoreArmor: profile.finisher,
      stagger: profile.stagger,
      variant: profile.variant,
    })
    if (hit) {
      const variant = profile.variant || (profile.heavy ? 'orange' : 'cyan')
      state.spawnHitEffect([target.position[0], target.position[1] + 1.25, target.position[2]], variant)
    }
  }

  useFrame((_, delta) => {
    const state = useGameStore.getState()

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      current.current = null
      phase.current = 'idle'
      phaseTimer.current = 0
      queued.current = null
      comboStep.current = 0
      comboExpireAt.current = 0
      hitApplied.current = false
      multiHitTimer.current = 0
      multiHitsApplied.current = 0
    }

    if (!isCombatActive(state) || state.status !== 'running' || state.storyModal) {
      if (current.current) finishAction()
      return
    }

    if (observedRequest.current !== state.combatRequestSerial) {
      observedRequest.current = state.combatRequestSerial
      const request = state.combatRequest?.type
      if (request) {
        const canStart = !current.current || phase.current === 'idle'
        const canCancel = request === 'dodge' && phase.current === 'recovery'
        const canQueueLight = current.current?.startsWith('light') && request === 'light' && ['startup', 'active', 'recovery'].includes(phase.current)
        if (canStart || canCancel) startAction(request, state)
        else if (canQueueLight) queued.current = 'light'
        else if (phase.current === 'recovery') queued.current = request
      }
    }

    regenTimer.current += delta
    if (regenTimer.current > 0.16) {
      regenTimer.current = 0
      const latest = useGameStore.getState()
      if (!latest.blockHeld && !current.current && latest.combatEnergy < 100) {
        latest.setCombatRuntime({ combatEnergy: Math.min(100, latest.combatEnergy + 2.4) })
      }
      if (latest.combatMessage && latest.combatMessageUntil > 0 && performance.now() > latest.combatMessageUntil) {
        latest.setCombatRuntime({ combatMessage: null, combatMessageUntil: 0 })
      }
    }

    if (!current.current || performance.now() < state.hitStopUntil) return

    const profile = ATTACKS[current.current]
    phaseTimer.current -= Math.min(delta, 1 / 30)

    if (phase.current === 'active' && current.current === 'rapid') {
      multiHitTimer.current += delta
      while (multiHitTimer.current >= profile.hitInterval && multiHitsApplied.current < profile.multiHits) {
        multiHitTimer.current -= profile.hitInterval
        multiHitsApplied.current += 1
        const latest = useGameStore.getState()
        const targets = selectTargets(latest, profile)
        for (const target of targets) applyHit(latest, target, profile)
      }
    }

    if (phase.current === 'active' && !hitApplied.current && current.current !== 'dodge' && current.current !== 'rapid') {
      hitApplied.current = true
      const targets = selectTargets(state, profile)
      for (const target of targets) applyHit(state, target, profile)
    }

    if (phaseTimer.current > 0) return

    if (phase.current === 'startup') {
      phase.current = 'active'
      phaseTimer.current = profile.active
      hitApplied.current = false
      state.setCombatRuntime({ combatPhase: 'active' })
      return
    }

    if (phase.current === 'active') {
      phase.current = 'recovery'
      phaseTimer.current = profile.recovery
      state.setCombatRuntime({ combatPhase: 'recovery' })
      return
    }

    if (phase.current === 'recovery') {
      const next = queued.current
      if (next) startAction(next, useGameStore.getState())
      else finishAction()
    }
  })

  return null
}
