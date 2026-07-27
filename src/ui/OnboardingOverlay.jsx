import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'

function keyboardPrompt(state) {
  if (state.storyModal === 'transmission' || state.storyModal === 'log') return ['CONTINUE SIGNAL', 'Press ENTER to continue.']
  if (state.nearbyTerminal) return ['INTERACT', 'Press E to access the highlighted terminal.']
  if (state.gameMode === 'race') {
    if (state.cycleSpeed < 20) return ['ACCELERATE', 'Hold W to build speed. A and D steer the cycle.']
    if (state.boostEnergy > 92) return ['BOOST', 'Hold SHIFT on a straight section. Press T for loop autopilot.']
    return ['CIRCUIT CONTROL', 'SPACE drifts. T toggles autopilot. ESC opens the command deck.']
  }
  if (state.gameMode === 'combat' || state.storyStage === 2 || state.verticalStage === 1) {
    if (!state.lockOnTargetId) return ['TARGET ACQUISITION', 'Press TAB to lock the nearest Blackguard.']
    if (state.combatActionSerial < 1) return ['BASIC COMBAT', 'Left-click or J performs the light combo. Q blocks and parries.']
    if (state.combatEnergy > 30) return ['FIGHTING SKILLS', 'L: Rapid Punching • U: Arc Slam • I: Nova Pulse']
    return ['SURVIVE', 'SPACE dodges. Successful parries and attacks restore combat resources.']
  }
  if (state.playerSpeed < 8) return ['MOVEMENT LINK', 'Use WASD to move. Hold SHIFT to sprint.']
  return ['OBJECTIVE LINK', 'Follow the cyan objective signal. Press E near interactive systems.']
}

function gamepadPrompt(state) {
  if (state.storyModal === 'transmission' || state.storyModal === 'log') return ['CONTINUE SIGNAL', 'Press A or B to continue.']
  if (state.storyModal === 'hack') return ['RELAY DECODE', 'Use A, B, X, and Y as signal nodes 1, 2, 3, and 4.']
  if (state.storyModal === 'choice') return ['CORE AUTHORIZATION', 'Press X to stabilize AXIOM or Y to liberate the fragments.']
  if (state.nearbyTerminal) return ['INTERACT', 'Press A or B to access the highlighted terminal.']
  if (state.gameMode === 'race' || (state.gameMode === 'vertical' && state.verticalMounted)) {
    if (state.cycleSpeed < 20) return ['VEHICLE LINK', 'Right trigger accelerates, left trigger brakes, and the left stick steers.']
    return ['VEHICLE SKILLS', 'A drifts, RB boosts, and Y toggles loop autopilot during Velocity Trial.']
  }
  if (state.gameMode === 'combat' || state.storyStage === 2 || state.verticalStage === 1) {
    if (!state.lockOnTargetId) return ['TARGET ACQUISITION', 'Press the right stick to lock the nearest Blackguard.']
    return ['COMBAT LINK', 'X light • Y heavy • A dodge • LB guard • RB disc • D-pad skills.']
  }
  return ['MOVEMENT LINK', 'Use the left stick to move, click it to sprint, and press A or B near terminals.']
}

export default function OnboardingOverlay() {
  const state = useGameStore()
  const [visible, setVisible] = useState(true)
  const prompt = useMemo(() => state.inputDevice === 'gamepad' ? gamepadPrompt(state) : keyboardPrompt(state), [state])

  useEffect(() => {
    if (!state.gameMode || state.status !== 'running') return undefined
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 9000)
    return () => window.clearTimeout(timer)
  }, [state.gameMode, state.verticalStage, state.storyStage, state.raceStatus, state.lockOnTargetId])

  if (!state.tutorialEnabled || state.onboardingDismissed || !visible || state.status !== 'running' || state.systemPanel) return null

  return (
    <aside className="onboarding-card glass-panel" role="status" aria-live="polite">
      <span>PLAYER GUIDE // {state.inputDevice.toUpperCase()}</span>
      <strong>{prompt[0]}</strong>
      <p>{prompt[1]}</p>
      <div>
        <button type="button" onClick={() => setVisible(false)}>HIDE</button>
        <button type="button" onClick={state.dismissOnboarding}>DON'T SHOW AGAIN</button>
      </div>
    </aside>
  )
}
