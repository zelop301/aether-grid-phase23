import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore.js'

const target = new THREE.Vector3()
const offset = new THREE.Vector3()
const desired = new THREE.Vector3()

export default function PhotoCameraController() {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const systemPanel = useGameStore((state) => state.systemPanel)
  const orbit = useRef({ yaw: 0, pitch: 0.35, distance: 9, dragging: false, x: 0, y: 0, initialized: false })

  useEffect(() => {
    const element = gl.domElement
    if (systemPanel !== 'photo') {
      orbit.current.initialized = false
      element.style.cursor = ''
      return undefined
    }
    const position = useGameStore.getState().playerPosition
    target.fromArray(position).add(new THREE.Vector3(0, 1.3, 0))
    offset.copy(camera.position).sub(target)
    orbit.current.distance = THREE.MathUtils.clamp(offset.length(), 3.5, 22)
    orbit.current.yaw = Math.atan2(offset.x, offset.z)
    orbit.current.pitch = Math.asin(THREE.MathUtils.clamp(offset.y / orbit.current.distance, -0.9, 0.9))
    orbit.current.initialized = true
    element.style.cursor = 'grab'
    const pointerDown = (event) => {
      if (event.button !== 0) return
      orbit.current.dragging = true
      orbit.current.x = event.clientX
      orbit.current.y = event.clientY
      element.setPointerCapture?.(event.pointerId)
      element.style.cursor = 'grabbing'
    }
    const pointerMove = (event) => {
      if (!orbit.current.dragging) return
      const dx = event.clientX - orbit.current.x
      const dy = event.clientY - orbit.current.y
      orbit.current.x = event.clientX
      orbit.current.y = event.clientY
      orbit.current.yaw -= dx * 0.006
      orbit.current.pitch = THREE.MathUtils.clamp(orbit.current.pitch + dy * 0.0045, -0.12, 1.18)
    }
    const pointerUp = (event) => {
      orbit.current.dragging = false
      element.releasePointerCapture?.(event.pointerId)
      element.style.cursor = 'grab'
    }
    const wheel = (event) => {
      event.preventDefault()
      orbit.current.distance = THREE.MathUtils.clamp(orbit.current.distance + event.deltaY * 0.012, 3.5, 22)
    }
    element.addEventListener('pointerdown', pointerDown)
    element.addEventListener('pointermove', pointerMove)
    element.addEventListener('pointerup', pointerUp)
    element.addEventListener('pointercancel', pointerUp)
    element.addEventListener('wheel', wheel, { passive: false })
    return () => {
      element.removeEventListener('pointerdown', pointerDown)
      element.removeEventListener('pointermove', pointerMove)
      element.removeEventListener('pointerup', pointerUp)
      element.removeEventListener('pointercancel', pointerUp)
      element.removeEventListener('wheel', wheel)
      element.style.cursor = ''
    }
  }, [camera, gl, systemPanel])

  useFrame(() => {
    if (systemPanel !== 'photo' || !orbit.current.initialized) return
    const position = useGameStore.getState().playerPosition
    target.fromArray(position).add(new THREE.Vector3(0, 1.3, 0))
    const horizontal = Math.cos(orbit.current.pitch) * orbit.current.distance
    desired.set(
      Math.sin(orbit.current.yaw) * horizontal,
      Math.sin(orbit.current.pitch) * orbit.current.distance,
      Math.cos(orbit.current.yaw) * horizontal,
    ).add(target)
    camera.position.lerp(desired, 0.18)
    camera.lookAt(target)
    camera.fov = THREE.MathUtils.lerp(camera.fov, 48, 0.12)
    camera.updateProjectionMatrix()
  })
  return null
}
