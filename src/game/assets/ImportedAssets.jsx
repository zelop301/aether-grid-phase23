import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ASSET_REGISTRY, ASSETS_BY_MODE } from '../../core/assetRegistry.ts'

export const MODEL_URLS = {
  operator: ASSET_REGISTRY.cipherRunner.path,
  baseMesh: ASSET_REGISTRY.riderFallback.path,
  weapons: ASSET_REGISTRY.vectorArsenal.path,
  coreRings: ASSET_REGISTRY.coreRings.path,
  interceptor: ASSET_REGISTRY.interceptor.path,
  tunnel: ASSET_REGISTRY.transitTunnel.path,
  lightCycle: ASSET_REGISTRY.fluxCycle.path,
  rivalCycle: ASSET_REGISTRY.rivalCycle.path,
  blackguard: ASSET_REGISTRY.warden.path,
  buildings: ASSET_REGISTRY.city.path,
  lightJet: ASSET_REGISTRY.vectorJet.path,
  citizenCar: ASSET_REGISTRY.civilianRunner.path,
  lightRunner: ASSET_REGISTRY.securityRunner.path,
  hallway: ASSET_REGISTRY.genesisHallway.path,
}

function cloneMaterial(material) {
  if (!material) return material
  if (Array.isArray(material)) return material.map((item) => item.clone())
  return material.clone()
}

function createClone(scene, { filter, shadows = true, tuneMaterial } = {}) {
  const clone = scene.clone(true)
  clone.traverse((object) => {
    if (!object.isMesh) return
    object.visible = filter ? Boolean(filter(object)) : true
    object.castShadow = shadows
    object.receiveShadow = shadows
    object.frustumCulled = true
    object.material = cloneMaterial(object.material)
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach((material) => {
      if ('envMapIntensity' in material) material.envMapIntensity = 1.15
      tuneMaterial?.(material, object)
      material.needsUpdate = true
    })
  })
  return clone
}


export function OperatorAsset({ shadows = true }) {
  const { scene } = useGLTF(MODEL_URLS.operator)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material) => {
        if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.48)
        if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.48)
      },
    }),
    [scene, shadows],
  )

  return <primitive object={model} scale={0.00246} position={[0, 0.02, 0]} />
}

export function BaseMeshRiderAsset({ shadows = true }) {
  const { scene } = useGLTF(MODEL_URLS.baseMesh)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material) => {
        if ('color' in material) material.color.set('#071116')
        if ('emissive' in material) material.emissive.set('#22e7f7')
        if ('emissiveIntensity' in material) material.emissiveIntensity = 0.75
        if ('metalness' in material) material.metalness = 0.78
        if ('roughness' in material) material.roughness = 0.3
      },
    }),
    [scene, shadows],
  )

  return <primitive object={model} scale={0.52} position={[0, 0.58, -0.2]} rotation={[-0.72, 0, 0]} />
}


export function CycleRiderAsset({ shadows = true, accent = '#2cecff', fit }) {
  const { scene } = useGLTF(MODEL_URLS.operator)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material, object) => {
        const name = `${material.name} ${object.name}`.toLowerCase()
        if ('color' in material) {
          if (/(visor|glass|light)/.test(name)) material.color.set('#f4feff')
          else material.color.set('#07131a')
        }
        if ('emissive' in material) {
          material.emissive.set(/(visor|line|glow|light)/.test(name) ? accent : '#061217')
          material.emissiveIntensity = /(visor|line|glow|light)/.test(name) ? 1.9 : 0.38
        }
        if ('metalness' in material) material.metalness = 0.8
        if ('roughness' in material) material.roughness = /(visor|glass)/.test(name) ? 0.18 : 0.34
      },
    }),
    [scene, shadows, accent],
  )
  const position = fit?.position || [0, 0.17, -0.3]
  const rotation = fit?.rotation || [-0.68, Math.PI, 0]
  const scale = fit?.scale || 0.00112

  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

function discFilter(object) {
  const name = object.name.toLowerCase()
  return name.includes('disc') && !name.includes('hold')
}

export function FluxDiscAsset({ shadows = false, scale = 3.45 }) {
  const { scene } = useGLTF(MODEL_URLS.weapons)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      filter: discFilter,
      tuneMaterial: (material, object) => {
        const name = `${material.name} ${object.name}`.toLowerCase()
        if ('emissive' in material && name.includes('light')) {
          material.emissive.set('#6ff7ff')
          material.emissiveIntensity = 5.5
        }
        if ('metalness' in material) material.metalness = 0.72
        if ('roughness' in material) material.roughness = 0.16
      },
    }),
    [scene, shadows],
  )

  return <primitive object={model} scale={scale} />
}

export function WeaponArchiveAsset({ shadows = true }) {
  const { scene } = useGLTF(MODEL_URLS.weapons)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material) => {
        if ('emissiveIntensity' in material && material.emissive) material.emissiveIntensity *= 1.8
        if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.58)
        if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.36)
      },
    }),
    [scene, shadows],
  )

  return (
    <group position={[18, 0.15, 11.2]} rotation={[0, -0.78, 0]}>
      <primitive object={model} scale={0.72} />
      <pointLight position={[0, 2.2, 0]} color="#915eff" intensity={5} distance={8} decay={2} />
    </group>
  )
}

export function CoreRingAsset({ shadows = true }) {
  const { scene } = useGLTF(MODEL_URLS.coreRings)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material, object) => {
        const alternate = object.name.endsWith('4') || object.name.endsWith('6')
        if ('color' in material) material.color.set(alternate ? '#835dff' : '#20e9ff')
        if ('emissive' in material) material.emissive.set(alternate ? '#724eff' : '#20e9ff')
        if ('emissiveIntensity' in material) material.emissiveIntensity = 2.4
        if ('metalness' in material) material.metalness = 0.76
        if ('roughness' in material) material.roughness = 0.2
      },
    }),
    [scene, shadows],
  )
  const root = useRef()

  useFrame((_, delta) => {
    if (root.current) root.current.rotation.y += delta * 0.075
  })

  return (
    <group ref={root} position={[0, 7.25, 0]} rotation={[0.12, 0, 0.15]}>
      <primitive object={model} scale={0.235} />
    </group>
  )
}

export function LightCycleAsset({ shadows = true, accent = '#27eaff' }) {
  const { scene } = useGLTF(MODEL_URLS.lightCycle)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material, object) => {
        const name = `${material.name} ${object.name}`.toLowerCase()
        if ('metalness' in material) material.metalness = 0.82
        if ('roughness' in material) material.roughness = 0.24
        if ('color' in material) {
          if (name.includes('red')) material.color.set(accent)
          else if (name.includes('white')) material.color.set('#0a1820')
          else if (name.includes('metal')) material.color.set('#091117')
          else material.color.set('#02070b')
        }
        if ('emissive' in material) {
          material.emissive.set(name.includes('red') ? accent : '#071820')
          material.emissiveIntensity = name.includes('red') ? 2.7 : 0.35
        }
      },
    }),
    [scene, shadows, accent],
  )

  return <primitive object={model} position={[0, 0.02, 0]} />
}

export function RivalCycleAsset({ accent = '#ff9448' }) {
  const { scene } = useGLTF(MODEL_URLS.rivalCycle)
  const model = useMemo(
    () => createClone(scene, {
      shadows: false,
      tuneMaterial: (material, object) => {
        const name = `${material.name} ${object.name}`.toLowerCase()
        if ('color' in material && name.includes('glow')) material.color.set(accent)
        if ('emissive' in material && name.includes('glow')) {
          material.emissive.set(accent)
          material.emissiveIntensity = 3.2
        }
        if ('metalness' in material) material.metalness = name.includes('glow') ? 0.35 : 0.86
        if ('roughness' in material) material.roughness = name.includes('glow') ? 0.14 : 0.24
      },
    }),
    [scene, accent],
  )
  return <primitive object={model} />
}

export function BlackguardAsset({ shadows = true, accent = '#ff405c', hunter = false }) {
  const { scene } = useGLTF(MODEL_URLS.blackguard)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material, object) => {
        const name = `${material.name} ${object.name}`.toLowerCase()
        if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.62)
        if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.4)
        if ('emissive' in material && /(emiss|guard|baton|disk)/.test(name)) {
          material.emissive.set(accent)
          material.emissiveIntensity = hunter ? 3.8 : 2.7
        }
      },
    }),
    [scene, shadows, accent, hunter],
  )

  return <primitive object={model} rotation={[0, Math.PI, 0]} scale={hunter ? 1.08 : 0.96} />
}

export function TunnelAsset({
  shadows = true,
  visible = true,
  position = [0, 0.01, -32],
  rotation = [0, 0, 0],
  scale = 1,
  lights = true,
}) {
  const { scene } = useGLTF(MODEL_URLS.tunnel)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      tuneMaterial: (material) => {
        if ('emissiveIntensity' in material) material.emissiveIntensity = Math.min(1.35, material.emissiveIntensity || 0.8)
        if ('metalness' in material) material.metalness = 0.7
        if ('roughness' in material) material.roughness = 0.34
      },
    }),
    [scene, shadows],
  )

  if (!visible) return null
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} />
      {lights && (
        <>
          <pointLight position={[-7.5, 2.5, 0]} color="#2cecff" intensity={3.2} distance={10} decay={2} />
          <pointLight position={[7.5, 2.5, 0]} color="#845cff" intensity={3.2} distance={10} decay={2} />
        </>
      )}
    </group>
  )
}

function interceptorFilter(object) {
  return /(chopper|rotor)/i.test(object.name)
}

export function SecurityInterceptorAsset({ shadows = true, reducedMotion = false }) {
  const { scene } = useGLTF(MODEL_URLS.interceptor)
  const model = useMemo(
    () => createClone(scene, {
      shadows,
      filter: interceptorFilter,
      tuneMaterial: (material, object) => {
        const rotor = /rotor/i.test(object.name)
        if ('color' in material && !rotor) material.color.multiplyScalar(0.68)
        if ('emissive' in material) material.emissive.set(rotor ? '#bffcff' : '#1adff4')
        if ('emissiveIntensity' in material) material.emissiveIntensity = rotor ? 1.8 : 0.65
        if ('metalness' in material) material.metalness = 0.82
        if ('roughness' in material) material.roughness = 0.26
      },
    }),
    [scene, shadows],
  )
  const root = useRef()
  const rotorMeshes = useMemo(() => {
    const meshes = []
    model.traverse((object) => {
      if (object.isMesh && /rotor/i.test(object.name)) meshes.push(object)
    })
    return meshes
  }, [model])

  useFrame(({ clock }, delta) => {
    if (!root.current) return
    const time = clock.getElapsedTime() * (reducedMotion ? 0.12 : 0.34)
    const radius = 34
    root.current.position.set(Math.cos(time) * radius, 14.5 + Math.sin(time * 1.8) * 1.2, Math.sin(time) * radius)
    root.current.rotation.y = -time + Math.PI * 0.5
    rotorMeshes.forEach((mesh, index) => {
      mesh.rotation.z += delta * (index % 2 === 0 ? 16 : -13)
    })
  })

  return (
    <group ref={root} position={[30, 14, 0]}>
      <primitive object={model} scale={0.56} rotation={[0, Math.PI, 0]} />
      <pointLight position={[0, -0.7, 0]} color="#2be8ff" intensity={7} distance={11} decay={2} />
    </group>
  )
}

export function GridSkylineAsset({ shadows = false, visible = true, instances = 2 }) {
  const { scene } = useGLTF(MODEL_URLS.buildings)
  const models = useMemo(() => Array.from({ length: instances }, () => createClone(scene, {
    shadows,
    tuneMaterial: (material, object) => {
      const name = `${material.name} ${object.name}`.toLowerCase()
      if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.68)
      if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.38)
      if ('emissive' in material && /(glow|light|emissive)/.test(name)) {
        material.emissive.set(name.includes('bridge') ? '#8d66ff' : '#24e9ff')
        material.emissiveIntensity = 2.4
      }
    },
  })), [scene, shadows, instances])

  if (!visible) return null
  return (
    <group>
      {models[0] && <primitive object={models[0]} position={[39, 0, -31]} rotation={[0, -0.72, 0]} scale={0.9} />}
      {models[1] && <primitive object={models[1]} position={[-42, 0, 32]} rotation={[0, 2.42, 0]} scale={0.82} />}
    </group>
  )
}

export function LightJetPatrolAsset({ shadows = true, reducedMotion = false }) {
  const { scene } = useGLTF(MODEL_URLS.lightJet)
  const model = useMemo(() => createClone(scene, {
    shadows,
    tuneMaterial: (material) => {
      if ('metalness' in material) material.metalness = 0.78
      if ('roughness' in material) material.roughness = 0.2
      if ('emissive' in material) {
        material.emissive.set('#52efff')
        material.emissiveIntensity = 2.8
      }
    },
  }), [scene, shadows])
  const root = useRef()

  useFrame(({ clock }) => {
    if (!root.current) return
    const t = clock.getElapsedTime() * (reducedMotion ? 0.06 : 0.18) + 2.3
    root.current.position.set(Math.cos(t) * 27, 10.5 + Math.sin(t * 2) * 0.7, Math.sin(t) * 27)
    root.current.rotation.y = -t + Math.PI / 2
    root.current.rotation.z = Math.sin(t * 1.8) * 0.12
  })

  return (
    <group ref={root} position={[-20, 11, 12]}>
      <primitive object={model} rotation={[0, Math.PI, 0]} />
      <pointLight position={[0, -0.2, -2.6]} color="#63f4ff" intensity={5} distance={7} decay={2} />
    </group>
  )
}

export function CitizenTrafficAsset({ shadows = false, reducedMotion = false }) {
  const { scene } = useGLTF(MODEL_URLS.citizenCar)
  const model = useMemo(() => createClone(scene, { shadows }), [scene, shadows])
  const root = useRef()

  useFrame(({ clock }) => {
    if (!root.current) return
    const t = clock.getElapsedTime() * (reducedMotion ? 0.08 : 0.24) + 0.7
    const radius = 21
    root.current.position.set(Math.cos(t) * radius, 0.08, Math.sin(t) * radius)
    root.current.rotation.y = -t + Math.PI / 2
  })

  return <group ref={root}><primitive object={model} scale={0.82} /></group>
}

export function LightRunnerAsset({ shadows = true, active = false }) {
  const { scene } = useGLTF(MODEL_URLS.lightRunner)
  const model = useMemo(() => createClone(scene, {
    shadows,
    tuneMaterial: (material) => {
      if ('emissiveIntensity' in material && material.emissive) material.emissiveIntensity = active ? 3.8 : 2.2
    },
  }), [scene, shadows, active])

  return (
    <group position={[12, 0.04, -14]} rotation={[0, -0.7, 0]}>
      <primitive object={model} scale={0.82} />
      <pointLight position={[0, 1.1, 0]} color="#ff8b38" intensity={active ? 7 : 3} distance={8} decay={2} />
    </group>
  )
}

export function StoryHallwayAsset({ shadows = true }) {
  const { scene } = useGLTF(MODEL_URLS.hallway)
  const model = useMemo(() => createClone(scene, { shadows }), [scene, shadows])

  return (
    <group position={[0, 0, -17]}>
      <primitive object={model} />
      <pointLight position={[0, 3.4, 0]} color="#2cecff" intensity={7} distance={16} decay={2} />
      <pointLight position={[0, 3.2, -7]} color="#ff405c" intensity={4} distance={10} decay={2} />
    </group>
  )
}

export function preloadAssetsForMode(mode) {
  const key = mode === 'vertical' ? 'campaign' : mode
  ;(ASSETS_BY_MODE[key] || []).forEach((url) => useGLTF.preload(url))
}
