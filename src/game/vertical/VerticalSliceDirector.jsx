import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

export default function VerticalSliceDirector() {
  const gameMode = useGameStore((state) => state.gameMode)
  const stage = useGameStore((state) => state.verticalStage)
  const wave = useGameStore((state) => state.verticalWave)
  const notify = useGameStore((state) => state.notify)
  const transitionTimer = useRef(0)
  const missionTime = useRef(0)
  const observedReset = useRef(-1)

  useEffect(() => {
    if (gameMode !== 'vertical') return
    const messages = [
      'GENESIS BREACH // INFILTRATION ACTIVE',
      `WARDEN FORMATION ${Math.max(1, wave)} / 3`,
      'EXTRACTION CYCLE READY // FOUR GATES',
      'GENESIS BREACH VERIFIED',
    ]
    notify(messages[stage] || messages[0])
  }, [gameMode, notify, stage, wave])

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    if (state.gameMode !== 'vertical') return
    if (observedReset.current !== state.resetNonce) {
      observedReset.current = state.resetNonce
      missionTime.current = state.verticalMissionTime || 0
      transitionTimer.current = 0
    }
    if (state.status === 'running' && !state.storyModal) {
      missionTime.current += delta
      if (Math.floor(missionTime.current * 2) !== Math.floor((state.verticalMissionTime || 0) * 2)) {
        state.setVerticalMissionTime(missionTime.current)
      }
    }
    if (state.verticalStage !== 1 || state.storyModal) {
      transitionTimer.current = 0
      return
    }
    const activeAlive = state.enemies.filter((enemy) => enemy.active !== false && enemy.alive).length
    if (activeAlive > 0 || state.verticalWave >= 3) {
      transitionTimer.current = 0
      return
    }
    transitionTimer.current += delta
    if (transitionTimer.current >= 1.15) {
      transitionTimer.current = 0
      state.advanceVerticalWave()
    }
  })

  return null
}
