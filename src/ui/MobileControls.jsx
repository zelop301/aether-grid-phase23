import { useGameStore } from '../store/useGameStore.js'

function ControlButton({ label, action, className = '' }) {
  const setInput = useGameStore((state) => state.setInput)

  const activate = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setInput(action, true)
  }

  const deactivate = (event) => {
    event.preventDefault()
    setInput(action, false)
  }

  return (
    <button
      type="button"
      className={`mobile-control ${className}`}
      aria-label={label}
      onPointerDown={activate}
      onPointerUp={deactivate}
      onPointerCancel={deactivate}
      onPointerLeave={deactivate}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label}
    </button>
  )
}

function AttackButton() {
  const requestAttack = useGameStore((state) => state.requestAttack)
  const discState = useGameStore((state) => state.discState)

  return (
    <button
      type="button"
      className={`mobile-control attack-control ${discState !== 'ready' ? 'cooling' : ''}`}
      onPointerDown={(event) => {
        event.preventDefault()
        requestAttack()
      }}
    >
      DISC
    </button>
  )
}


function CombatActionButton({ label, type, className = '' }) {
  const requestCombatAction = useGameStore((state) => state.requestCombatAction)
  return (
    <button
      type="button"
      className={`mobile-control combat-action-control ${className}`}
      onPointerDown={(event) => {
        event.preventDefault()
        requestCombatAction(type)
      }}
    >
      {label}
    </button>
  )
}


function ContextCombatButton() {
  const performCombatContextAction = useGameStore((state) => state.performCombatContextAction)
  return (
    <button
      type="button"
      className="mobile-control combat-action-control context-control"
      onPointerDown={(event) => {
        event.preventDefault()
        performCombatContextAction()
      }}
    >
      LINK
    </button>
  )
}

function GuardButton() {
  const setBlockHeld = useGameStore((state) => state.setBlockHeld)
  return (
    <button
      type="button"
      className="mobile-control combat-action-control guard-control"
      onPointerDown={(event) => { event.preventDefault(); setBlockHeld(true) }}
      onPointerUp={(event) => { event.preventDefault(); setBlockHeld(false) }}
      onPointerCancel={() => setBlockHeld(false)}
      onPointerLeave={() => setBlockHeld(false)}
    >
      GUARD
    </button>
  )
}

function CombatActions() {
  return (
    <div className="mobile-combat-grid">
      <CombatActionButton label="LIGHT" type="light" />
      <CombatActionButton label="HEAVY" type="heavy" />
      <CombatActionButton label="RAPID" type="rapid" className="rapid-control" />
      <GuardButton />
      <CombatActionButton label="DODGE" type="dodge" />
      <AttackButton />
      <CombatActionButton label="SLAM" type="slam" />
      <CombatActionButton label="NOVA" type="nova" />
      <ContextCombatButton />
    </div>
  )
}

function InteractButton() {
  const interactWithStory = useGameStore((state) => state.interactWithStory)
  const nearbyTerminal = useGameStore((state) => state.nearbyTerminal)
  return (
    <button
      type="button"
      className={`mobile-control interact-control ${nearbyTerminal ? 'available' : ''}`}
      disabled={!nearbyTerminal}
      onPointerDown={(event) => {
        event.preventDefault()
        interactWithStory()
      }}
    >
      LINK
    </button>
  )
}


function AutopilotButton() {
  const enabled = useGameStore((state) => state.autopilotEnabled)
  const toggleAutopilot = useGameStore((state) => state.toggleAutopilot)
  return (
    <button
      type="button"
      className={`mobile-control autopilot-control ${enabled ? 'active' : ''}`}
      aria-pressed={enabled}
      onPointerDown={(event) => {
        event.preventDefault()
        toggleAutopilot()
      }}
    >
      {enabled ? 'AUTO ON' : 'AUTO'}
    </button>
  )
}

export default function MobileControls({ mode }) {
  const storyStage = useGameStore((state) => state.storyStage)
  const storyModal = useGameStore((state) => state.storyModal)
  const verticalStage = useGameStore((state) => state.verticalStage)
  const verticalMounted = useGameStore((state) => state.verticalMounted)
  const storyCombat = mode === 'story' && storyStage === 2
  const verticalCombat = mode === 'vertical' && verticalStage === 1
  const verticalEscape = mode === 'vertical' && verticalMounted
  const togglePause = useGameStore((state) => state.togglePause)

  if (storyModal) return (
    <div className="mobile-controls mobile-controls--modal">
      <button type="button" className="mobile-command-control" onPointerDown={(event) => { event.preventDefault(); togglePause() }}>MENU</button>
    </div>
  )

  return (
    <div className={`mobile-controls mobile-controls--${mode || 'idle'}`} aria-label="Touch controls">
      <button type="button" className="mobile-command-control" onPointerDown={(event) => { event.preventDefault(); togglePause() }}>MENU</button>
      <div className="mobile-dpad">
        <ControlButton label="▲" action="forward" className="dpad-up" />
        <ControlButton label="◀" action="left" className="dpad-left" />
        <ControlButton label="▶" action="right" className="dpad-right" />
        <ControlButton label="▼" action="backward" className="dpad-down" />
      </div>
      <div className="mobile-actions">
        {mode === 'race' && <AutopilotButton />}
        {mode === 'race' || verticalEscape ? (
          <ControlButton label="DRIFT" action="drift" className="attack-control drift-control" />
        ) : (mode === 'story' && !storyCombat) || (mode === 'vertical' && !verticalCombat) ? (
          <InteractButton />
        ) : (
          <CombatActions />
        )}
        <ControlButton label="BOOST" action="sprint" className="boost-control" />
      </div>
    </div>
  )
}
