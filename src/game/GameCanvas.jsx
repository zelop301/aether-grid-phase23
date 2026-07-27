import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import World from './World.jsx'
import RenderTuning from './systems/RenderTuning.jsx'
import PhotoCameraController from './systems/PhotoCameraController.jsx'
import ScreenshotBridge from './systems/ScreenshotBridge.jsx'
import { QUALITY_PRESETS, useGameStore } from '../store/useGameStore.js'

export default function GameCanvas() {
  const quality = useGameStore((state) => state.quality)
  const status = useGameStore((state) => state.status)
  const systemPanel = useGameStore((state) => state.systemPanel)
  const preset = QUALITY_PRESETS[quality]
  const pausedWithoutCamera = status === 'paused' && systemPanel !== 'photo'
  return (
    <Canvas
      className="game-canvas"
      dpr={preset.dpr}
      shadows={preset.shadows}
      frameloop={pausedWithoutCamera ? 'demand' : 'always'}
      camera={{ position: [0, 5.2, 9.5], fov: 54, near: 0.1, far: 240 }}
      gl={{ antialias: quality === 'high', alpha: false, powerPreference: 'high-performance', stencil: false, depth: true, precision: 'mediump', logarithmicDepthBuffer: false }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
    >
      <Suspense fallback={null}>
        <World preset={preset} />
        <RenderTuning />
        <PhotoCameraController />
        <ScreenshotBridge />
      </Suspense>
    </Canvas>
  )
}
