import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

function phaseFromIntegrity(enemy) {
  if (!enemy?.alive) return 3
  const ratio = enemy.hp / Math.max(1, enemy.maxHp)
  if (ratio > 0.66) return 1
  if (ratio > 0.33) return 2
  return 3
}

export default function BossPhaseDirector() {
  const observedReset = useRef(-1)
  const phaseLock = useRef(1)

  useFrame(() => {
    const state = useGameStore.getState()
    if (observedReset.current !== state.resetNonce) {
      observedReset.current = state.resetNonce
      phaseLock.current = state.bossPhase || 1
    }

    if (
      state.gameMode !== 'vertical'
      || state.status !== 'running'
      || state.verticalStage !== 1
      || state.verticalWave !== 3
      || state.storyModal
    ) return

    const commander = state.enemies.find((enemy) => enemy.id === 'commander-01' && enemy.active !== false)
    if (!commander?.alive) return

    const nextPhase = phaseFromIntegrity(commander)
    if (nextPhase <= phaseLock.current || nextPhase <= state.bossPhase) return

    phaseLock.current = nextPhase
    state.setBossPhase(nextPhase)
  })

  return null
}
