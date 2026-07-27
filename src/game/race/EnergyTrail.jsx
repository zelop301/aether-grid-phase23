import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const tempObject = new THREE.Object3D()
const start = new THREE.Vector3()
const end = new THREE.Vector3()
const midpoint = new THREE.Vector3()

const EnergyTrail = forwardRef(function EnergyTrail(
  { color = '#24e8ff', maxSegments = 64, height = 0.82, opacity = 0.62 },
  ref,
) {
  const mesh = useRef()
  const points = useRef([])
  const lastPoint = useRef(new THREE.Vector3(999, 999, 999))
  const dirty = useRef(true)

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      }),
    [color, opacity],
  )

  useImperativeHandle(ref, () => ({
    push(position) {
      const x = position.x
      const z = position.z
      const dx = lastPoint.current.x - x
      const dz = lastPoint.current.z - z
      if (dx * dx + dz * dz < 0.3) return
      const next = new THREE.Vector3(x, 0.48, z)
      points.current.push(next)
      lastPoint.current.set(x, 0.48, z)
      if (points.current.length > maxSegments + 1) points.current.shift()
      dirty.current = true
    },
    clear() {
      points.current = []
      lastPoint.current.set(999, 999, 999)
      dirty.current = true
    },
  }), [maxSegments])

  useFrame(() => {
    if (!mesh.current || !dirty.current) return
    dirty.current = false
    const trailPoints = points.current
    const segmentCount = Math.min(maxSegments, Math.max(0, trailPoints.length - 1))

    for (let index = 0; index < maxSegments; index += 1) {
      if (index < segmentCount) {
        start.copy(trailPoints[index])
        end.copy(trailPoints[index + 1])
        midpoint.copy(start).lerp(end, 0.5)
        const distance = Math.max(0.08, start.distanceTo(end))
        const dx = end.x - start.x
        const dz = end.z - start.z
        const fade = THREE.MathUtils.clamp((index + 5) / Math.max(8, segmentCount), 0.12, 1)

        tempObject.position.copy(midpoint)
        tempObject.position.y = (height * fade) / 2 + 0.05
        tempObject.rotation.set(0, Math.atan2(dx, dz), 0)
        tempObject.scale.set(0.075, height * fade, distance + 0.05)
      } else {
        tempObject.position.set(0, -20, 0)
        tempObject.rotation.set(0, 0, 0)
        tempObject.scale.setScalar(0.001)
      }
      tempObject.updateMatrix()
      mesh.current.setMatrixAt(index, tempObject.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, maxSegments]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
})

export default EnergyTrail
