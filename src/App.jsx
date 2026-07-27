import { useEffect } from 'react'
import GameCanvas from './game/GameCanvas.jsx'
import BootScreen from './ui/BootScreen.jsx'
import HUD from './ui/HUD.jsx'
import OutcomeOverlay from './ui/OutcomeOverlay.jsx'
import StoryOverlay from './ui/StoryOverlay.jsx'
import SystemOverlay from './ui/SystemOverlay.jsx'
import CinematicLayer from './ui/CinematicLayer.jsx'
import AudioDirector from './audio/AudioDirector.jsx'
import OnboardingOverlay from './ui/OnboardingOverlay.jsx'
import GameErrorBoundary from './ui/GameErrorBoundary.jsx'
import { useGameStore } from './store/useGameStore.js'
import { useKeyboardInput } from './hooks/useKeyboardInput.js'
import { useGamepadInput } from './hooks/useGamepadInput.js'

export default function App() {
  useKeyboardInput()
  useGamepadInput()
  const status = useGameStore((state) => state.status)
  const systemPanel = useGameStore((state) => state.systemPanel)
  const resetInput = useGameStore((state) => state.resetInput)
  const reducedMotion = useGameStore((state) => state.reducedMotion)
  const highContrast = useGameStore((state) => state.highContrast)
  const hudVisible = useGameStore((state) => state.hudVisible)
  const photoFilter = useGameStore((state) => state.photoFilter)
  const compactHud = useGameStore((state) => state.compactHud)
  const reducedFlashing = useGameStore((state) => state.reducedFlashing)
  const setInputDevice = useGameStore((state) => state.setInputDevice)
  const showBoot = status === 'booting' || status === 'ready'
  const showHud = ['running', 'paused', 'mission_complete', 'game_over'].includes(status) && hudVisible && systemPanel !== 'photo'

  useEffect(() => {
    const stopMovement = () => resetInput()
    const keyboard = () => setInputDevice('keyboard')
    const pointer = () => setInputDevice('mouse')
    const gamepad = () => setInputDevice('gamepad')
    window.addEventListener('blur', stopMovement)
    document.addEventListener('visibilitychange', stopMovement)
    window.addEventListener('keydown', keyboard, { passive: true })
    window.addEventListener('pointerdown', pointer, { passive: true })
    window.addEventListener('gamepadconnected', gamepad)
    return () => {
      window.removeEventListener('blur', stopMovement)
      document.removeEventListener('visibilitychange', stopMovement)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('pointerdown', pointer)
      window.removeEventListener('gamepadconnected', gamepad)
    }
  }, [resetInput, setInputDevice])

  return (
    <main className={`app-shell ${reducedMotion ? 'reduced-motion' : ''} ${reducedFlashing ? 'reduced-flashing' : ''} ${highContrast ? 'high-contrast' : ''} ${compactHud ? 'compact-hud' : ''} photo-filter--${photoFilter} panel-${systemPanel || 'none'}`}>
      <GameErrorBoundary><GameCanvas /></GameErrorBoundary>
      <AudioDirector />
      <CinematicLayer />
      {showBoot && <BootScreen />}
      {showHud && <HUD />}
      <OnboardingOverlay />
      <StoryOverlay />
      {(status === 'mission_complete' || status === 'game_over') && <OutcomeOverlay />}
      <SystemOverlay />
    </main>
  )
}
