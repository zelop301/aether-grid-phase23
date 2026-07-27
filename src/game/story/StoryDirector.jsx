import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import StoryTerminal from './StoryTerminal.jsx'
import { useGameStore } from '../../store/useGameStore.js'

function isTerminalActive(terminal, stage, recoveredLogs, gameMode, verticalStage) {
  if (gameMode === 'vertical') return terminal.type === 'relay' && verticalStage === 0 && !terminal.completed
  if (terminal.type === 'relay') return stage === 0 && !terminal.completed
  if (terminal.type === 'archive') return stage === 1 && !recoveredLogs.includes(terminal.id)
  if (terminal.type === 'core') return stage === 3
  return false
}

export default function StoryDirector({ shadows }) {
  const storyTerminals = useGameStore((state) => state.storyTerminals)
  const storyStage = useGameStore((state) => state.storyStage)
  const recoveredLogs = useGameStore((state) => state.recoveredLogs)
  const gameMode = useGameStore((state) => state.gameMode)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const checkTimer = useRef(0)
  const player = useRef(new THREE.Vector3())
  const terminalPosition = useRef(new THREE.Vector3())

  const activeMap = useMemo(
    () => Object.fromEntries(storyTerminals.map((terminal) => [terminal.id, isTerminalActive(terminal, storyStage, recoveredLogs, gameMode, verticalStage)])),
    [gameMode, recoveredLogs, storyStage, storyTerminals, verticalStage],
  )

  useFrame((_, delta) => {
    checkTimer.current += delta
    if (checkTimer.current < 0.1) return
    checkTimer.current = 0

    const state = useGameStore.getState()
    if (!['story', 'vertical'].includes(state.gameMode) || state.status !== 'running' || state.storyModal) {
      state.setNearbyTerminal(null)
      return
    }

    player.current.fromArray(state.playerPosition)
    let nearest = null
    let nearestDistance = 3.35

    for (const terminal of state.storyTerminals) {
      if (!isTerminalActive(terminal, state.storyStage, state.recoveredLogs, state.gameMode, state.verticalStage)) continue
      terminalPosition.current.fromArray(terminal.position)
      const distance = player.current.distanceTo(terminalPosition.current)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = terminal
      }
    }

    state.setNearbyTerminal(nearest)
  })

  return (
    <group>
      {storyTerminals.map((terminal) => (
        <StoryTerminal
          key={terminal.id}
          terminal={terminal}
          active={Boolean(activeMap[terminal.id])}
          shadows={shadows}
        />
      ))}
    </group>
  )
}
