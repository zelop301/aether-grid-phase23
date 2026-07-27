import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { playGameSound, setMusicScene, unlockAudio, updateAudioSettings } from './audioEngine.js'

export default function AudioDirector() {
  const unlocked = useGameStore((state) => state.audioUnlocked)
  const masterVolume = useGameStore((state) => state.masterVolume)
  const musicVolume = useGameStore((state) => state.musicVolume)
  const sfxVolume = useGameStore((state) => state.sfxVolume)
  const muted = useGameStore((state) => state.muted)
  const status = useGameStore((state) => state.status)
  const gameMode = useGameStore((state) => state.gameMode)
  const attackSerial = useGameStore((state) => state.attackSerial)
  const damageSerial = useGameStore((state) => state.damageSerial)
  const checkpointIndex = useGameStore((state) => state.checkpointIndex)
  const lap = useGameStore((state) => state.lap)
  const hackInputLength = useGameStore((state) => state.hackInput.length)
  const verticalCheckpointIndex = useGameStore((state) => state.verticalCheckpointIndex)
  const combatImpactSerial = useGameStore((state) => state.combatImpactSerial)
  const combatImpactKind = useGameStore((state) => state.combatImpactKind)
  const combatParries = useGameStore((state) => state.combatParries)
  const combatDodges = useGameStore((state) => state.combatDodges)
  const bossPhaseTransitionSerial = useGameStore((state) => state.bossPhaseTransitionSerial)
  const observed = useRef({ attackSerial, damageSerial, checkpointIndex, lap, hackInputLength, verticalCheckpointIndex, combatImpactSerial, combatParries, combatDodges, bossPhaseTransitionSerial, status })

  useEffect(() => {
    if (!unlocked) return
    unlockAudio().then(() => updateAudioSettings({ masterVolume, musicVolume, sfxVolume, muted }))
  }, [masterVolume, musicVolume, muted, sfxVolume, unlocked])

  useEffect(() => {
    updateAudioSettings({ masterVolume, musicVolume, sfxVolume, muted })
  }, [masterVolume, musicVolume, muted, sfxVolume])

  useEffect(() => {
    const scene = status === 'paused'
      ? 'paused'
      : status === 'mission_complete'
        ? 'complete'
        : status === 'running'
          ? gameMode || 'menu'
          : 'menu'
    setMusicScene(scene)
  }, [gameMode, status])

  useEffect(() => {
    if (attackSerial !== observed.current.attackSerial) playGameSound('disc')
    observed.current.attackSerial = attackSerial
  }, [attackSerial])

  useEffect(() => {
    if (damageSerial !== observed.current.damageSerial) playGameSound('damage')
    observed.current.damageSerial = damageSerial
  }, [damageSerial])

  useEffect(() => {
    if (checkpointIndex !== observed.current.checkpointIndex || lap !== observed.current.lap) playGameSound('checkpoint')
    observed.current.checkpointIndex = checkpointIndex
    observed.current.lap = lap
  }, [checkpointIndex, lap])

  useEffect(() => {
    if (verticalCheckpointIndex !== observed.current.verticalCheckpointIndex && verticalCheckpointIndex > 0) playGameSound('checkpoint')
    observed.current.verticalCheckpointIndex = verticalCheckpointIndex
  }, [verticalCheckpointIndex])

  useEffect(() => {
    if (hackInputLength > observed.current.hackInputLength) playGameSound('hack')
    observed.current.hackInputLength = hackInputLength
  }, [hackInputLength])


  useEffect(() => {
    if (combatImpactSerial !== observed.current.combatImpactSerial) playGameSound(combatImpactKind || 'light')
    observed.current.combatImpactSerial = combatImpactSerial
  }, [combatImpactKind, combatImpactSerial])

  useEffect(() => {
    if (combatParries > observed.current.combatParries) playGameSound('parry')
    observed.current.combatParries = combatParries
  }, [combatParries])

  useEffect(() => {
    if (combatDodges > observed.current.combatDodges) playGameSound('dodge')
    observed.current.combatDodges = combatDodges
  }, [combatDodges])

  useEffect(() => {
    if (bossPhaseTransitionSerial !== observed.current.bossPhaseTransitionSerial) playGameSound('bossPhase')
    observed.current.bossPhaseTransitionSerial = bossPhaseTransitionSerial
  }, [bossPhaseTransitionSerial])

  useEffect(() => {
    if (status === 'mission_complete' && observed.current.status !== 'mission_complete') playGameSound('complete')
    observed.current.status = status
  }, [status])

  return null
}
