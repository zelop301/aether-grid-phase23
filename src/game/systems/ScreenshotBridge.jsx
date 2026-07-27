import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const filters = {
  neutral: 'none',
  cyan: 'contrast(1.08) saturate(1.18) hue-rotate(2deg)',
  noir: 'grayscale(1) contrast(1.28) brightness(0.9)',
  amber: 'sepia(0.45) saturate(1.35) hue-rotate(338deg) contrast(1.08)',
}

function flipPixels(source, width, height) {
  const rowSize = width * 4
  const output = new Uint8ClampedArray(source.length)
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * rowSize
    const targetOffset = (height - row - 1) * rowSize
    output.set(source.subarray(sourceOffset, sourceOffset + rowSize), targetOffset)
  }
  return output
}

export default function ScreenshotBridge() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const screenshotSerial = useGameStore((state) => state.screenshotSerial)
  const photoFilter = useGameStore((state) => state.photoFilter)
  const gameMode = useGameStore((state) => state.gameMode)
  const setScreenshotMessage = useGameStore((state) => state.setScreenshotMessage)
  const observed = useRef(0)

  useEffect(() => {
    if (!screenshotSerial || screenshotSerial === observed.current) return undefined
    observed.current = screenshotSerial

    const capture = window.setTimeout(() => {
      const sourceWidth = gl.domElement.width
      const sourceHeight = gl.domElement.height
      const scale = Math.min(1, 3840 / sourceWidth, 2160 / sourceHeight)
      const width = Math.max(1, Math.round(sourceWidth * scale))
      const height = Math.max(1, Math.round(sourceHeight * scale))
      const target = new THREE.WebGLRenderTarget(width, height, {
        depthBuffer: true,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      })
      target.texture.colorSpace = THREE.SRGBColorSpace

      const previousTarget = gl.getRenderTarget()
      const previousAspect = camera.aspect
      try {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        gl.setRenderTarget(target)
        gl.clear()
        gl.render(scene, camera)

        const raw = new Uint8Array(width * height * 4)
        gl.readRenderTargetPixels(target, 0, 0, width, height, raw)

        const sourceCanvas = document.createElement('canvas')
        sourceCanvas.width = width
        sourceCanvas.height = height
        const sourceContext = sourceCanvas.getContext('2d')
        if (!sourceContext) throw new Error('2D source context unavailable')
        const flipped = flipPixels(raw, width, height)
        sourceContext.putImageData(new ImageData(flipped, width, height), 0, 0)

        const output = document.createElement('canvas')
        output.width = width
        output.height = height
        const context = output.getContext('2d')
        if (!context) throw new Error('2D capture context unavailable')
        context.filter = filters[photoFilter] || filters.neutral
        context.drawImage(sourceCanvas, 0, 0)

        output.toBlob((blob) => {
          if (!blob) {
            setScreenshotMessage('CAPTURE FAILED')
            return
          }
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          link.href = url
          link.download = `aether-grid-${gameMode || 'showcase'}-${photoFilter}-${stamp}.png`
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
          setScreenshotMessage('FRAME SAVED')
          window.setTimeout(() => setScreenshotMessage(null), 1800)
        }, 'image/png')
      } catch {
        setScreenshotMessage('CAPTURE FAILED')
      } finally {
        gl.setRenderTarget(previousTarget)
        camera.aspect = previousAspect
        camera.updateProjectionMatrix()
        target.dispose()
      }
    }, 80)

    return () => window.clearTimeout(capture)
  }, [camera, gameMode, gl, photoFilter, scene, screenshotSerial, setScreenshotMessage])

  return null
}
