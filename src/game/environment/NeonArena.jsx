import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CoreRingAsset } from '../assets/ImportedAssets.jsx'

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

function Tower({ position, height, width, accent, shadows }) {
  return (
    <group position={position}>
      <mesh castShadow={shadows} receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color="#050c11" roughness={0.42} metalness={0.8} />
      </mesh>
      <mesh position={[0, height * 0.58, -width / 2 - 0.012]}>
        <boxGeometry args={[width * 0.09, height * 0.58, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[width / 2 + 0.012, height * 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[width * 0.09, height * 0.34, 0.035]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, height + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.72, width * 0.72]} />
        <meshBasicMaterial color={accent} transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  )
}

function CentralCore({ shadows }) {
  const rings = useRef()
  const upperRing = useRef()

  useFrame(({ clock }, delta) => {
    if (rings.current) rings.current.rotation.y += delta * 0.18
    if (upperRing.current) {
      upperRing.current.rotation.z += delta * 0.33
      upperRing.current.position.y = 7.7 + Math.sin(clock.getElapsedTime() * 1.15) * 0.22
    }
  })

  return (
    <group>
      <mesh position={[0, 2.75, 0]}>
        <cylinderGeometry args={[2.25, 3.1, 5.5, 12, 1, false]} />
        <meshStandardMaterial
          color="#07151b"
          emissive="#0a9eb0"
          emissiveIntensity={0.65}
          metalness={0.88}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[0, 5.62, 0]}>
        <cylinderGeometry args={[0.35, 1.95, 0.24, 12]} />
        <meshBasicMaterial color="#3feeff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 10.4, 0]}>
        <cylinderGeometry args={[0.085, 0.28, 9.5, 8]} />
        <meshBasicMaterial color="#41eeff" transparent opacity={0.5} toneMapped={false} />
      </mesh>

      <group ref={rings} position={[0, 3.2, 0]}>
        {[2.7, 3.35, 4].map((radius, index) => (
          <mesh key={radius} rotation={[Math.PI / 2, index * 0.3, 0]}>
            <torusGeometry args={[radius, 0.055, 8, 64]} />
            <meshBasicMaterial color={index === 1 ? '#845cff' : '#24e8ff'} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <CoreRingAsset shadows={shadows} />

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.35}>
        <mesh ref={upperRing} position={[0, 7.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.32, 0.13, 10, 48]} />
          <meshStandardMaterial
            color="#122b36"
            emissive="#68f4ff"
            emissiveIntensity={3}
            metalness={0.72}
            roughness={0.18}
          />
        </mesh>
      </Float>
    </group>
  )
}

function Road({ rotation = 0 }) {
  return (
    <group rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -26]} receiveShadow>
        <planeGeometry args={[8, 52]} />
        <meshStandardMaterial color="#03090d" roughness={0.62} metalness={0.58} />
      </mesh>
      {[-3.65, 3.65].map((x) => (
        <mesh key={x} position={[x, 0.035, -26]}>
          <boxGeometry args={[0.08, 0.045, 52]} />
          <meshBasicMaterial color="#20e5ff" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, -26]}>
        <boxGeometry args={[0.045, 0.035, 52]} />
        <meshBasicMaterial color="#7f5cff" transparent opacity={0.7} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function NeonArena({ towerCount, shadows }) {
  const towers = useMemo(() => {
    const random = seededRandom(2077)
    const accents = ['#22e7ff', '#4e91ff', '#8b5cff', '#ff9f43']

    return Array.from({ length: towerCount }, (_, index) => {
      const ring = index % 2 === 0 ? 37 : 47
      const angle = (index / towerCount) * Math.PI * 2 + random() * 0.12
      const radius = ring + (random() - 0.5) * 4
      const height = 4.5 + random() * 14
      const width = 1.6 + random() * 2.5

      return {
        id: index,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        height,
        width,
        accent: accents[index % accents.length],
      }
    })
  }, [towerCount])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[58, 64]} />
        <meshStandardMaterial color="#02070b" roughness={0.7} metalness={0.42} />
      </mesh>

      <gridHelper
        args={[116, 58, '#1adff3', '#123642']}
        position={[0, 0.025, 0]}
        material-transparent
        material-opacity={0.42}
      />

      {[14, 25, 34, 50].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04 + index * 0.003, 0]}>
          <torusGeometry args={[radius, index === 3 ? 0.12 : 0.055, 8, 128]} />
          <meshBasicMaterial
            color={index === 2 ? '#8058ff' : '#1de5f8'}
            transparent
            opacity={index === 3 ? 0.95 : 0.72}
            toneMapped={false}
          />
        </mesh>
      ))}

      <Road />
      <Road rotation={Math.PI / 2} />

      <CentralCore shadows={shadows} />

      {towers.map((tower) => (
        <Tower key={tower.id} {...tower} shadows={shadows} />
      ))}

      {Array.from({ length: 20 }, (_, index) => {
        const angle = (index / 20) * Math.PI * 2
        const x = Math.cos(angle) * 55
        const z = Math.sin(angle) * 55
        return (
          <group key={index} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            <mesh position={[0, 1.7, 0]}>
              <boxGeometry args={[0.32, 3.4, 0.32]} />
              <meshStandardMaterial color="#07141b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 2.6, -0.18]}>
              <boxGeometry args={[0.06, 1.2, 0.05]} />
              <meshBasicMaterial color={index % 5 === 0 ? '#ff9d3f' : '#21e5fa'} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
