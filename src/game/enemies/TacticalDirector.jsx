import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

function combatActive(state) {
  return state.gameMode === 'combat'
    || (state.gameMode === 'story' && state.storyStage === 2)
    || (state.gameMode === 'vertical' && state.verticalStage === 1)
}

function chooseTactic(state, alive) {
  const commander = alive.find((enemy) => enemy.type === 'commander')
  if (commander) return state.bossPhase >= 3 ? 'overdrive' : state.bossPhase === 2 ? 'assault' : 'warden'
  if (state.health <= 34) return 'hunt'
  if (alive.some((enemy) => enemy.type === 'disc_guard') && alive.some((enemy) => enemy.type === 'defender')) return 'suppress'
  if (alive.length >= 3) return 'surround'
  if (alive.length === 2) return 'pressure'
  return 'probe'
}

function tokenLimit(state, tactic) {
  const modifierBonus = state.activeRunModifier === 'overdrive' ? 1 : 0
  if (state.difficulty === 'explorer') return Math.min(2, 1 + modifierBonus)
  if (state.difficulty === 'master' && ['hunt', 'overdrive', 'assault'].includes(tactic)) return Math.min(4, 3 + modifierBonus)
  return Math.min(3, 2 + modifierBonus)
}

export default function TacticalDirector() {
  const timer = useRef(0)

  useFrame((_, delta) => {
    timer.current += delta
    if (timer.current < 0.65) return
    timer.current = 0

    const state = useGameStore.getState()
    if (!combatActive(state) || state.status !== 'running' || state.storyModal) return

    const alive = state.enemies.filter((enemy) => enemy.alive && enemy.active !== false)
    const tactic = chooseTactic(state, alive)
    const limit = tokenLimit(state, tactic)
    const bossPressure = alive.some((enemy) => enemy.type === 'commander') ? state.bossPhase * 14 : 0
    const threat = Math.min(100, Math.round(alive.length * 13 + bossPressure + (100 - state.health) * 0.26 + state.verticalWave * 6))

    if (tactic !== state.squadTactic || threat !== state.squadThreat || limit !== state.attackTokenLimit) {
      state.setSquadRuntime({ squadTactic: tactic, squadThreat: threat, attackTokenLimit: limit })
    }
  })

  return null
}
