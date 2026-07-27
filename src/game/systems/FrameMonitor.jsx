import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

export default function FrameMonitor() {
  const elapsed = useRef(0)
  const frames = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    frames.current += 1

    if (elapsed.current >= 0.6) {
      const fps = Math.round(frames.current / elapsed.current)
      useGameStore.getState().setFps(Math.min(144, fps))
      elapsed.current = 0
      frames.current = 0
    }
  })

  return null
}
