import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import NeonArena from './environment/NeonArena.jsx'
import RaceEnvironment from './environment/RaceEnvironment.jsx'
import BootEnvironment from './environment/BootEnvironment.jsx'
import Player from './player/Player.jsx'
import FrameMonitor from './systems/FrameMonitor.jsx'
import EnemyDirector from './enemies/EnemyDirector.jsx'
import FluxDisc from './combat/FluxDisc.jsx'
import CombatEffects from './combat/CombatEffects.jsx'
import CombatDirector from './combat/CombatDirector.jsx'
import BossPhaseDirector from './combat/BossPhaseDirector.jsx'
import PickupDirector from './pickups/PickupDirector.jsx'
import RaceTrack from './race/RaceTrack.jsx'
import CyclePlayer from './race/CyclePlayer.jsx'
import RaceDirector from './race/RaceDirector.jsx'
import RaceRivals from './race/RaceRivals.jsx'
import StoryDirector from './story/StoryDirector.jsx'
import VerticalEscapeTrack from './vertical/VerticalEscapeTrack.jsx'
import VerticalEscapeCycle from './vertical/VerticalEscapeCycle.jsx'
import VerticalSliceDirector from './vertical/VerticalSliceDirector.jsx'
import GenesisBreachEnvironment from './vertical/GenesisBreachEnvironment.jsx'
import TacticalDirector from './enemies/TacticalDirector.jsx'
import AetherConduits from './environment/AetherConduits.jsx'
import {
  CitizenTrafficAsset,
  GridSkylineAsset,
  LightJetPatrolAsset,
  LightRunnerAsset,
  SecurityInterceptorAsset,
  StoryHallwayAsset,
  TunnelAsset,
  WeaponArchiveAsset,
} from './assets/ImportedAssets.jsx'
import { useGameStore } from '../store/useGameStore.js'

export default function World({ preset }) {
  const coreLight = useRef()
  const gameMode = useGameStore((state) => state.gameMode)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const verticalMounted = useGameStore((state) => state.verticalMounted)

  useFrame(({ clock }) => {
    if (!coreLight.current || gameMode === 'race') return
    const time = clock.getElapsedTime()
    coreLight.current.intensity = 22 + Math.sin(time * 2.1) * 5
  })

  return (
    <>
      <color attach="background" args={['#02070b']} />
      <fog attach="fog" args={['#02070b', 28, 128]} />

      <ambientLight intensity={0.38} color="#a8d8ff" />
      <hemisphereLight args={['#75cfff', '#02060a', 0.55]} />
      <directionalLight
        castShadow={preset.shadows}
        position={[12, 20, 8]}
        intensity={1.4}
        color="#d8f6ff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {gameMode !== 'race' && <pointLight ref={coreLight} position={[0, 8, 0]} color="#20e7ff" distance={42} decay={2} />}
      {gameMode !== 'race' && preset.lightCount >= 4 && (
        <>
          <pointLight position={[22, 4, 20]} color="#744cff" intensity={12} distance={30} />
          <pointLight position={[-22, 4, -20]} color="#10ddff" intensity={10} distance={28} />
        </>
      )}
      {gameMode !== 'race' && preset.lightCount >= 6 && (
        <>
          <pointLight position={[-24, 3, 18]} color="#ff9d31" intensity={9} distance={24} />
          <pointLight position={[24, 3, -18]} color="#3a7dff" intensity={9} distance={24} />
        </>
      )}

      {preset.assetDetail !== 'minimal' && (
        <Sparkles
          count={!gameMode ? 30 : gameMode === 'race' ? Math.round(preset.particles * 0.3) : preset.particles}
          scale={[105, 28, 105]}
          size={1.05}
          speed={0.16}
          opacity={0.48}
          color="#66eaff"
          noise={1.5}
        />
      )}

      {!gameMode ? (
        <BootEnvironment />
      ) : gameMode === 'race' ? (
        <RaceEnvironment preset={preset} />
      ) : (
        <>
          <NeonArena towerCount={preset.towers} shadows={preset.shadows} />
          {preset.assetDetail !== 'minimal' && <GridSkylineAsset shadows={preset.shadows} visible instances={preset.assetDetail === 'full' ? 2 : 1} />}
          {preset.assetDetail === 'full' && <CitizenTrafficAsset shadows={preset.shadows} reducedMotion={reducedMotion} />}
          {preset.assetDetail === 'full' && <LightJetPatrolAsset shadows={preset.shadows} reducedMotion={reducedMotion} />}
          {preset.assetDetail !== 'minimal' && <SecurityInterceptorAsset shadows={preset.shadows} reducedMotion={reducedMotion} />}
        </>
      )}
      {gameMode === 'vertical' && <GenesisBreachEnvironment />}
      {gameMode && gameMode !== 'race' && <AetherConduits />}
      {gameMode && gameMode !== 'race' && <TacticalDirector />}
      {gameMode === 'vertical' && verticalMounted && (
        <TunnelAsset shadows={preset.shadows} position={[0, 0.01, -33]} scale={0.78} lights={preset.lightCount >= 4} />
      )}
      {(gameMode === 'story' || (gameMode === 'vertical' && !verticalMounted)) && (
        <>
          {gameMode === 'story' && <WeaponArchiveAsset shadows={preset.shadows} />}
          <StoryHallwayAsset shadows={preset.shadows} />
          <LightRunnerAsset shadows={preset.shadows} active />
        </>
      )}

      {gameMode === 'race' ? (
        <>
          <RaceTrack />
          <RaceRivals trailSegments={preset.trailSegments} />
          <CyclePlayer shadows={preset.shadows} trailSegments={preset.trailSegments} />
          <RaceDirector />
          <CombatEffects />
        </>
      ) : gameMode === 'vertical' ? (
        <>
          <VerticalSliceDirector />
          {verticalStage < 2 || !verticalMounted ? (
            <>
              <StoryDirector shadows={preset.shadows} />
              <PickupDirector />
              <EnemyDirector shadows={preset.shadows} />
              <CombatDirector />
              <BossPhaseDirector />
              <Player shadows={preset.shadows} />
              <FluxDisc />
              <CombatEffects />
            </>
          ) : (
            <>
              <VerticalEscapeTrack />
              <VerticalEscapeCycle shadows={preset.shadows} trailSegments={preset.trailSegments} />
              <CombatEffects />
            </>
          )}
        </>
      ) : gameMode === 'story' ? (
        <>
          <StoryDirector shadows={preset.shadows} />
          <PickupDirector />
          <EnemyDirector shadows={preset.shadows} />
          <CombatDirector />
          <Player shadows={preset.shadows} />
          <FluxDisc />
          <CombatEffects />
        </>
      ) : gameMode === 'combat' ? (
        <>
          <PickupDirector />
          <EnemyDirector shadows={preset.shadows} />
          <CombatDirector />
          <Player shadows={preset.shadows} />
          <FluxDisc />
          <CombatEffects />
        </>
      ) : null}

      <FrameMonitor />
    </>
  )
}
