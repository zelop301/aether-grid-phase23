import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'
import { RIVAL_BLUEPRINTS, TOTAL_CHECKPOINTS } from './raceConfig.js'

export default function RaceDirector() {
  const observedResetNonce = useRef(-1)
  const countdownElapsed = useRef(0)
  const raceElapsed = useRef(0)
  const updateTimer = useRef(0)
  const lastCountdown = useRef(3)

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    if (state.gameMode !== 'race' || state.status !== 'running') return

    if (observedResetNonce.current !== state.resetNonce) {
      observedResetNonce.current = state.resetNonce
      countdownElapsed.current = 0
      raceElapsed.current = 0
      updateTimer.current = 0
      lastCountdown.current = 3
      state.setRaceCountdown(3)
    }

    if (state.raceStatus === 'countdown') {
      countdownElapsed.current += delta
      const remaining = Math.max(0, Math.ceil(3.05 - countdownElapsed.current))
      if (remaining !== lastCountdown.current) {
        lastCountdown.current = remaining
        state.setRaceCountdown(remaining)
      }
      if (countdownElapsed.current >= 3.05) state.beginRace()
      return
    }

    if (state.raceStatus !== 'racing') return

    raceElapsed.current += delta
    updateTimer.current += delta
    if (updateTimer.current < 0.085) return
    updateTimer.current = 0

    const rivalProgress = Object.fromEntries(
      RIVAL_BLUEPRINTS.map((rival) => [
        rival.id,
        ((raceElapsed.current * rival.angularSpeed + rival.startOffset) / (Math.PI * 2)) *
          TOTAL_CHECKPOINTS,
      ]),
    )

    const playerProgress = (state.lap - 1) * TOTAL_CHECKPOINTS + state.checkpointIndex
    const racePosition = state.autopilotEnabled
      ? 1
      : 1 + Object.values(rivalProgress).filter((progress) => progress > playerProgress).length

    state.setRaceTime(raceElapsed.current)
    state.setRivalProgress(rivalProgress)
    state.setRacePosition(racePosition)
  })

  return null
}
