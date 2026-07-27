import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export default function BootEnvironment() {
  const ring = useRef()
  const core = useRef()

  useFrame(({ clock }, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.08
    if (core.current) core.current.position.y = 1.6 + Math.sin(clock.getElapsedTime() * 0.8) * 0.12
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[58, 64]} />
        <meshStandardMaterial color="#010508" metalness={0.32} roughness={0.86} />
      </mesh>
      <gridHelper args={[116, 58, '#163c45', '#07151b']} position={[0, 0.02, 0]} material-transparent material-opacity={0.32} />
      <group ref={ring} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {[6, 11, 17].map((radius, index) => (
          <mesh key={radius} rotation={[0, 0, index * 0.36]}>
            <torusGeometry args={[radius, index === 1 ? 0.055 : 0.03, 6, 96]} />
            <meshBasicMaterial color={index === 1 ? '#7658ff' : '#1edff2'} transparent opacity={0.34 + index * 0.08} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={core} position={[0, 1.6, 0]}>
        <mesh>
          <octahedronGeometry args={[1.15, 1]} />
          <meshStandardMaterial color="#071820" emissive="#1edff2" emissiveIntensity={1.4} metalness={0.78} roughness={0.24} />
        </mesh>
        <pointLight color="#28e9ff" intensity={6} distance={18} decay={2} />
      </group>
    </group>
  )
}
