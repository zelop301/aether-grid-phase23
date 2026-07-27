import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

export default function RenderTuning() {
  const gl = useThree((state) => state.gl)
  const exposure = useGameStore((state) => state.exposure)
  useEffect(() => { gl.toneMappingExposure = exposure }, [exposure, gl])
  return null
}
