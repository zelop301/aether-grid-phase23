import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TunnelAsset } from '../assets/ImportedAssets.jsx'
import { TRACK_INNER_RADIUS, TRACK_OUTER_RADIUS, TRACK_RADIUS } from '../race/raceConfig.js'

const matrixHelper = new THREE.Object3D()

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function DistantSkyline({ count = 24 }) {
  const bodies = useRef()
  const accents = useRef()
  const transforms = useMemo(() => {
    const random = seededRandom(4088)
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + random() * 0.1
      const radius = 53 + random() * 17
      const width = 1.8 + random() * 3.4
      const height = 7 + random() * 19
      return {
        angle,
        position: [Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius],
        scale: [width, height, width],
        accentScale: [0.08, height * 0.7, width * 0.05],
      }
    })
  }, [count])

  useEffect(() => {
    transforms.forEach((item, index) => {
      matrixHelper.position.fromArray(item.position)
      matrixHelper.rotation.set(0, -item.angle, 0)
      matrixHelper.scale.fromArray(item.scale)
      matrixHelper.updateMatrix()
      bodies.current?.setMatrixAt(index, matrixHelper.matrix)

      matrixHelper.position.set(item.position[0], item.position[1] * 1.04, item.position[2])
      matrixHelper.scale.fromArray(item.accentScale)
      matrixHelper.updateMatrix()
      accents.current?.setMatrixAt(index, matrixHelper.matrix)
    })
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true
    if (accents.current) accents.current.instanceMatrix.needsUpdate = true
  }, [transforms])

  return (
    <group>
      <instancedMesh ref={bodies} args={[null, null, count]} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#03090d" metalness={0.78} roughness={0.48} />
      </instancedMesh>
      <instancedMesh ref={accents} args={[null, null, count]} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#1ddff3" transparent opacity={0.68} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function InnerField() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <circleGeometry args={[TRACK_INNER_RADIUS - 0.7, 96]} />
        <meshStandardMaterial color="#010407" metalness={0.38} roughness={0.82} />
      </mesh>
      {[8, 15, 21.5].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.025 + index * 0.005, 0]}>
          <torusGeometry args={[radius, index === 2 ? 0.065 : 0.028, 6, 96]} />
          <meshBasicMaterial color={index === 1 ? '#7d5cff' : '#1edff2'} transparent opacity={index === 2 ? 0.55 : 0.26} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[2.3, 3.2, 0.85, 12]} />
        <meshStandardMaterial color="#041017" emissive="#0c5b67" emissiveIntensity={0.55} metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.08, 8, 48]} />
        <meshBasicMaterial color="#25e8fb" transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  )
}

function LowQualityTunnel() {
  return (
    <group position={[0, 0, -TRACK_RADIUS]}>
      {[-4.2, 4.2].map((z) => (
        <mesh key={z} position={[0, 1.55, z]}>
          <boxGeometry args={[20, 3.1, 0.28]} />
          <meshStandardMaterial color="#061018" emissive="#166d79" emissiveIntensity={0.65} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 3.02, 0]}>
        <boxGeometry args={[20, 0.22, 8.6]} />
        <meshStandardMaterial color="#061018" emissive="#7256ff" emissiveIntensity={0.8} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  )
}

export default function RaceEnvironment({ preset }) {
  const skylineCount = Math.max(16, Math.min(34, Math.round(preset.towers * 0.68)))
  const importedTunnel = preset.assetDetail !== 'minimal'

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[82, 96]} />
        <meshStandardMaterial color="#010407" metalness={0.3} roughness={0.84} />
      </mesh>
      <gridHelper
        args={[164, 82, '#17404a', '#071820']}
        position={[0, 0.012, 0]}
        material-transparent
        material-opacity={0.34}
      />
      <InnerField />
      <DistantSkyline count={skylineCount} />
      {importedTunnel ? (
        <TunnelAsset
          shadows={preset.shadows}
          position={[0, 0.015, -TRACK_RADIUS]}
          rotation={[0, 0, 0]}
          scale={0.84}
          lights={preset.lightCount >= 4}
        />
      ) : (
        <LowQualityTunnel />
      )}
      <pointLight position={[0, 7, 0]} color="#28e9ff" intensity={7} distance={33} decay={2} />
      <pointLight position={[0, 5, -TRACK_RADIUS]} color="#785cff" intensity={6} distance={18} decay={2} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <torusGeometry args={[TRACK_OUTER_RADIUS + 6.5, 0.05, 6, 128]} />
        <meshBasicMaterial color="#6a4cff" transparent opacity={0.28} toneMapped={false} />
      </mesh>
    </group>
  )
}
