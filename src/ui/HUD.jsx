import { QUALITY_PRESETS, useGameStore } from '../store/useGameStore.js'
import MobileControls from './MobileControls.jsx'
import { RACE_CHECKPOINTS } from '../game/race/raceConfig.js'

function QualityPanel() {
  const quality = useGameStore((state) => state.quality)
  const setQuality = useGameStore((state) => state.setQuality)
  const fps = useGameStore((state) => state.fps)
  const autoQuality = useGameStore((state) => state.autoQuality)
  const showFps = useGameStore((state) => state.showFps)
  const fpsState = fps >= 50 ? 'stable' : fps >= 35 ? 'warn' : 'critical'

  return (
    <div className="quality-compact">
      {showFps && <strong className={`fps-value fps-value--${fpsState}`}>{fps} FPS {autoQuality ? '• AUTO' : ''}</strong>}
      <div className="quality-selector" aria-label="Graphics quality">
        {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            className={quality === key ? 'active' : ''}
            onClick={() => setQuality(key)}
            aria-pressed={quality === key}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CombatHUD() {
  const playerSpeed = useGameStore((state) => state.playerSpeed)
  const health = useGameStore((state) => state.health)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const score = useGameStore((state) => state.score)
  const combo = useGameStore((state) => state.combo)
  const discState = useGameStore((state) => state.discState)
  const combatEnergy = useGameStore((state) => state.combatEnergy)
  const resolve = useGameStore((state) => state.resolve)
  const combatAction = useGameStore((state) => state.combatAction)
  const combatPhase = useGameStore((state) => state.combatPhase)
  const blockHeld = useGameStore((state) => state.blockHeld)
  const combatMessage = useGameStore((state) => state.combatMessage)
  const lockOnTargetId = useGameStore((state) => state.lockOnTargetId)
  const lockedEnemy = useGameStore((state) => state.enemies.find((enemy) => enemy.id === state.lockOnTargetId && enemy.alive && enemy.active !== false))
  const enemiesRemaining = useGameStore((state) => state.enemies.filter((enemy) => enemy.alive && enemy.active !== false).length)
  const inputDevice = useGameStore((state) => state.inputDevice)
  const squadTactic = useGameStore((state) => state.squadTactic)
  const squadThreat = useGameStore((state) => state.squadThreat)
  const attackTokenLimit = useGameStore((state) => state.attackTokenLimit)
  const conduitsTriggered = useGameStore((state) => state.conduitsTriggered)
  const chargedConduits = useGameStore((state) => state.arenaConduits.filter((conduit) => conduit.active).length)
  const selectedDoctrine = useGameStore((state) => state.selectedDoctrine)
  const activeRunModifier = useGameStore((state) => state.activeRunModifier)
  const healthPercent = (health / maxHealth) * 100
  const actionLabel = blockHeld ? 'GUARD' : combatAction === 'locomotion' ? 'READY' : `${combatAction.toUpperCase()} // ${combatPhase.toUpperCase()}`

  return (
    <>
      <aside className="hud-panel hud-panel--mission glass-panel combat-mission-panel">
        <span className="eyebrow">ARENA // ACTIVE ENCOUNTER</span>
        <h2>BREAK THE WARDEN FORMATION</h2>
        <div className="mission-row">
          <span className="status-dot status-dot--alert" />
          <span>{enemiesRemaining.toString().padStart(2, '0')} HOSTILES ACTIVE</span>
        </div>
        <div className="combat-objective-note">{attackTokenLimit} attack channel{attackTokenLimit === 1 ? '' : 's'} active // squad tactic: {squadTactic.toUpperCase()}</div>
      </aside>

      <aside className="hud-panel hud-panel--telemetry glass-panel">
        <QualityPanel />
        <div className="telemetry-row"><span>VELOCITY</span><strong>{playerSpeed.toString().padStart(3, '0')} U/S</strong></div>
        <div className="telemetry-row"><span>SCORE</span><strong>{score.toLocaleString('en-US')}</strong></div>
      </aside>

      <aside className="combat-status combat-status--phase16 glass-panel">
        <div className="combat-status__label"><span>OPERATOR INTEGRITY</span><strong>{health}%</strong></div>
        <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
        <div className="combat-resource-label"><span>COMBAT ENERGY</span><strong>{Math.round(combatEnergy)}%</strong></div>
        <div className="combat-resource-track"><div className="combat-resource-fill" style={{ width: `${combatEnergy}%` }} /></div>
        <div className="combat-resource-label"><span>RESOLVE</span><strong>{Math.round(resolve)}%</strong></div>
        <div className="resolve-track"><div className="resolve-fill" style={{ width: `${resolve}%` }} /></div>
        <div className="combat-action-row"><span>ACTION</span><strong>{actionLabel}</strong></div>
        <div className="weapon-row"><span>FLUX DISC</span><strong className={`disc-state disc-state--${discState}`}>{discState.toUpperCase()}</strong></div>
      </aside>

      <div className={`target-lock-card glass-panel ${lockOnTargetId ? 'active' : ''}`}>
        <span>TARGET LOCK</span>
        <strong>{lockedEnemy?.label || 'FREE AIM'}</strong>
        <small>{lockedEnemy ? `${Math.ceil(lockedEnemy.hp)} / ${lockedEnemy.maxHp} INTEGRITY` : 'TAB TO ACQUIRE'}</small>
      </div>

      {combatMessage && <div className="combat-callout">{combatMessage}</div>}
      {combo > 1 && <div className="combo-readout"><strong>x{combo}</strong><span>CHAIN</span></div>}
      <div className="squad-intel-chip glass-panel">
        <span>TACTIC <strong>{squadTactic.toUpperCase()}</strong></span>
        <span>THREAT <strong>{squadThreat}%</strong></span>
        <span>CONDUITS <strong>{chargedConduits}/4</strong></span>
        <span>OVERLOADS <strong>{conduitsTriggered}</strong></span>
      </div>

      <div className="reticle" aria-hidden="true"><span /><span /></div>

      <div className="combat-skill-bar glass-panel" aria-label="Combat skills">
        <div><kbd>J</kbd><span>LIGHT CHAIN</span><small>FREE</small></div>
        <div><kbd>K</kbd><span>HEAVY STRIKE</span><small>18 EN</small></div>
        <div className="combat-skill-bar__rapid"><kbd>L</kbd><span>RAPID PUNCH</span><small>24 EN</small></div>
        <div><kbd>U</kbd><span>ARC SLAM</span><small>30 EN</small></div>
        <div><kbd>I</kbd><span>NOVA PULSE</span><small>38 EN</small></div>
      </div>

      <div className="controls-hint glass-panel combat-controls-hint">
        {inputDevice === 'gamepad' ? (
          <><span><kbd>X / Y</kbd> LIGHT / HEAVY</span><span><kbd>LB</kbd> BLOCK / PARRY</span><span><kbd>A</kbd> DODGE</span><span><kbd>RB</kbd> DISC</span><span><kbd>D-PAD</kbd> SKILLS</span><span><kbd>R3</kbd> LOCK</span><span><kbd>B</kbd> LINK / FINISHER</span></>
        ) : (
          <><span><kbd>LMB / J</kbd> LIGHT COMBO</span><span><kbd>RMB / K</kbd> HEAVY</span><span><kbd>Q</kbd> BLOCK / PARRY</span><span><kbd>SPACE</kbd> DODGE</span><span><kbd>F</kbd> DISC</span><span><kbd>L / U / I</kbd> SKILLS</span><span><kbd>TAB</kbd> LOCK</span><span><kbd>E</kbd> LINK / FINISHER</span></>
        )}
      </div>

      
    </>
  )
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds - minutes * 60
  return `${minutes.toString().padStart(2, '0')}:${remaining.toFixed(2).padStart(5, '0')}`
}

function ordinal(position) {
  if (position === 1) return '1ST'
  if (position === 2) return '2ND'
  return '3RD'
}

function RaceHUD() {
  const health = useGameStore((state) => state.health)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const score = useGameStore((state) => state.score)
  const cycleSpeed = useGameStore((state) => state.cycleSpeed)
  const boostEnergy = useGameStore((state) => state.boostEnergy)
  const driftActive = useGameStore((state) => state.driftActive)
  const lap = useGameStore((state) => state.lap)
  const lapsToWin = useGameStore((state) => state.lapsToWin)
  const checkpointIndex = useGameStore((state) => state.checkpointIndex)
  const totalCheckpoints = useGameStore((state) => state.totalCheckpoints)
  const racePosition = useGameStore((state) => state.racePosition)
  const raceStatus = useGameStore((state) => state.raceStatus)
  const raceCountdown = useGameStore((state) => state.raceCountdown)
  const raceTime = useGameStore((state) => state.raceTime)
  const bestLap = useGameStore((state) => state.bestLap)
  const collisions = useGameStore((state) => state.collisions)
  const autopilotEnabled = useGameStore((state) => state.autopilotEnabled)
  const autopilotLoops = useGameStore((state) => state.autopilotLoops)
  const toggleAutopilot = useGameStore((state) => state.toggleAutopilot)
  const inputDevice = useGameStore((state) => state.inputDevice)
  const playerPosition = useGameStore((state) => state.playerPosition)
  const playerHeading = useGameStore((state) => state.playerHeading)
  const healthPercent = (health / maxHealth) * 100
  const activeGate = RACE_CHECKPOINTS[Math.min(checkpointIndex, RACE_CHECKPOINTS.length - 1)]
  const targetHeading = activeGate
    ? Math.atan2(activeGate.position[0] - playerPosition[0], activeGate.position[2] - playerPosition[2])
    : playerHeading
  const relativeGateAngle = Math.atan2(Math.sin(targetHeading - playerHeading), Math.cos(targetHeading - playerHeading))
  const gateDegrees = (relativeGateAngle * 180) / Math.PI

  return (
    <>
      <aside className="hud-panel hud-panel--mission glass-panel race-mission-panel">
        <span className="eyebrow">VELOCITY TRIAL // SECTOR 03</span>
        <h2>COMPLETE THE CIRCUIT</h2>
        <div className="race-objective-grid">
          <div><span>LAP</span><strong>{Math.min(lap, lapsToWin)} / {lapsToWin}</strong></div>
          <div><span>GATE</span><strong>{Math.min(checkpointIndex + 1, totalCheckpoints)} / {totalCheckpoints}</strong></div>
          <div><span>PLACE</span><strong className={`race-place race-place--${racePosition}`}>{ordinal(racePosition)}</strong></div>
        </div>
      </aside>

      <aside className="hud-panel hud-panel--telemetry glass-panel race-telemetry-panel">
        <QualityPanel />
        <div className="telemetry-row"><span>RACE TIME</span><strong>{formatTime(raceTime)}</strong></div>
        <div className="telemetry-row"><span>BEST LAP</span><strong>{bestLap === null ? '--:--.--' : formatTime(bestLap)}</strong></div>
        <div className="telemetry-row"><span>SCORE</span><strong>{score.toLocaleString('en-US')}</strong></div>
      </aside>

      <aside className="combat-status race-drive-status glass-panel">
        <div className="speed-readout"><span>VELOCITY</span><strong>{cycleSpeed.toString().padStart(3, '0')}</strong><small>U/S</small></div>
        <div className="drive-meter-label"><span>BOOST CAPACITOR</span><strong>{boostEnergy}%</strong></div>
        <div className="boost-track"><div className="boost-fill" style={{ width: `${boostEnergy}%` }} /></div>
        <div className="drive-meter-label"><span>HULL INTEGRITY</span><strong>{health}%</strong></div>
        <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
        <div className="race-drive-flags">
          <span className={driftActive ? 'active' : ''}>DRIFT {driftActive ? 'ENGAGED' : 'READY'}</span>
          <span>IMPACTS {collisions.toString().padStart(2, '0')}</span>
        </div>
        <button
          type="button"
          className={`autopilot-toggle ${autopilotEnabled ? 'active' : ''}`}
          onClick={toggleAutopilot}
          aria-pressed={autopilotEnabled}
        >
          <span>AUTOPILOT LOOP</span>
          <strong>{autopilotEnabled ? `ACTIVE // ${autopilotLoops} LOOPS` : 'STANDBY // PRESS T'}</strong>
        </button>
      </aside>

      {(raceStatus === 'countdown' || (raceStatus === 'racing' && raceTime < 0.75)) && (
        <div className={`race-countdown ${raceStatus === 'racing' ? 'race-countdown--go' : ''}`}>
          <span>{raceStatus === 'racing' ? 'GO' : raceCountdown}</span>
          <small>{raceStatus === 'racing' ? 'VELOCITY LINK OPEN' : 'CYCLE DRIVE LOCKED'}</small>
        </div>
      )}

      <div className="race-direction-indicator" aria-hidden="true">
        <span className="race-direction-arrow-shell"><i style={{ transform: `rotate(${gateDegrees}deg)` }}>▲</i></span>
        <strong>NEXT GATE</strong>
      </div>

      <div className="controls-hint glass-panel race-controls-hint">
        {inputDevice === 'gamepad' ? (
          <><span><kbd>RT / LT</kbd> THROTTLE / BRAKE</span><span><kbd>LEFT STICK</kbd> STEER</span><span><kbd>RB</kbd> BOOST</span><span><kbd>A</kbd> DRIFT</span><span><kbd>Y</kbd> AUTOPILOT LOOP</span><span><kbd>START</kbd> COMMAND</span></>
        ) : (
          <><span><kbd>W / S</kbd> THROTTLE / BRAKE</span><span><kbd>A / D</kbd> STEER</span><span><kbd>SHIFT</kbd> BOOST</span><span><kbd>SPACE</kbd> DRIFT</span><span><kbd>T</kbd> AUTOPILOT LOOP</span><span><kbd>ESC</kbd> COMMAND</span></>
        )}
      </div>

      
    </>
  )
}

function StoryHUD() {
  const health = useGameStore((state) => state.health)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const score = useGameStore((state) => state.score)
  const playerSpeed = useGameStore((state) => state.playerSpeed)
  const storyStage = useGameStore((state) => state.storyStage)
  const objective = useGameStore((state) => state.storyObjective)
  const recoveredLogs = useGameStore((state) => state.recoveredLogs)
  const discState = useGameStore((state) => state.discState)
  const enemiesRemaining = useGameStore((state) => state.enemies.filter((enemy) => enemy.alive && enemy.active !== false).length)
  const storyModal = useGameStore((state) => state.storyModal)
  const healthPercent = (health / maxHealth) * 100
  const combatActive = storyStage === 2
  const inputDevice = useGameStore((state) => state.inputDevice)

  return (
    <>
      <aside className="hud-panel hud-panel--mission glass-panel story-mission-panel">
        <span className="eyebrow">STORY PROTOCOL // SIGNAL FRACTURE</span>
        <h2>{objective.title}</h2>
        <div className="mission-row">
          <span className={`status-dot ${combatActive ? 'status-dot--alert' : ''}`} />
          <span>{objective.detail}</span>
        </div>
        <div className="story-stage-track">
          {[0, 1, 2, 3].map((stage) => (
            <span key={stage} className={storyStage >= stage ? 'active' : ''}>{stage + 1}</span>
          ))}
        </div>
      </aside>

      <aside className="hud-panel hud-panel--telemetry glass-panel story-telemetry-panel">
        <QualityPanel />
        <div className="telemetry-row"><span>VELOCITY</span><strong>{playerSpeed.toString().padStart(3, '0')} U/S</strong></div>
        <div className="telemetry-row"><span>ARCHIVES</span><strong>{recoveredLogs.length} / 2</strong></div>
        <div className="telemetry-row"><span>SCORE</span><strong>{score.toLocaleString('en-US')}</strong></div>
      </aside>

      <aside className="combat-status story-status glass-panel">
        <div className="combat-status__label"><span>OPERATOR INTEGRITY</span><strong>{health}%</strong></div>
        <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
        <div className="weapon-row">
          <span>{combatActive ? 'FLUX DISC' : 'MISSION LINK'}</span>
          <strong className={combatActive ? `disc-state disc-state--${discState}` : 'story-link-state'}>
            {combatActive ? discState.toUpperCase() : storyModal ? 'PAUSED' : 'STABLE'}
          </strong>
        </div>
        {combatActive && <div className="story-enemy-count"><span>WARDENS</span><strong>{enemiesRemaining.toString().padStart(2, '0')}</strong></div>}
      </aside>

      {combatActive && <div className="reticle" aria-hidden="true"><span /><span /></div>}

      <div className="controls-hint glass-panel story-controls-hint">
        {inputDevice === 'gamepad' ? (
          <><span><kbd>LEFT STICK</kbd> MOVE</span><span><kbd>L3</kbd> SPRINT</span><span><kbd>A / B</kbd> INTERACT</span>{combatActive && <><span><kbd>X / Y</kbd> ATTACK</span><span><kbd>LB / A</kbd> PARRY / DODGE</span><span><kbd>D-PAD</kbd> SKILLS</span></>}<span><kbd>START</kbd> COMMAND</span></>
        ) : (
          <><span><kbd>WASD</kbd> MOVE</span><span><kbd>SHIFT</kbd> SPRINT</span><span><kbd>E</kbd> INTERACT</span>{combatActive && <><span><kbd>LMB / RMB</kbd> COMBO</span><span><kbd>Q / SPACE</kbd> PARRY / DODGE</span><span><kbd>F</kbd> DISC</span><span><kbd>L / U / I</kbd> SKILLS</span></>}<span><kbd>ESC</kbd> COMMAND</span></>
        )}
      </div>

      
    </>
  )
}


function VerticalHUD() {
  const health = useGameStore((state) => state.health)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const score = useGameStore((state) => state.score)
  const stage = useGameStore((state) => state.verticalStage)
  const objective = useGameStore((state) => state.verticalObjective)
  const tutorial = useGameStore((state) => state.verticalTutorial)
  const mounted = useGameStore((state) => state.verticalMounted)
  const enemiesRemaining = useGameStore((state) => state.enemies.filter((enemy) => enemy.alive && enemy.active !== false).length)
  const discState = useGameStore((state) => state.discState)
  const playerSpeed = useGameStore((state) => state.playerSpeed)
  const boostEnergy = useGameStore((state) => state.boostEnergy)
  const driftActive = useGameStore((state) => state.driftActive)
  const checkpoint = useGameStore((state) => state.verticalCheckpointIndex)
  const verticalTime = useGameStore((state) => state.verticalTime)
  const collisions = useGameStore((state) => state.collisions)
  const wave = useGameStore((state) => state.verticalWave)
  const missionTime = useGameStore((state) => state.verticalMissionTime)
  const commander = useGameStore((state) => state.enemies.find((enemy) => enemy.id === 'commander-01'))
  const bossPhase = useGameStore((state) => state.bossPhase)
  const combatParries = useGameStore((state) => state.combatParries)
  const combatDodges = useGameStore((state) => state.combatDodges)
  const combatMaxCombo = useGameStore((state) => state.combatMaxCombo)
  const inputDevice = useGameStore((state) => state.inputDevice)
  const squadTactic = useGameStore((state) => state.squadTactic)
  const squadThreat = useGameStore((state) => state.squadThreat)
  const attackTokenLimit = useGameStore((state) => state.attackTokenLimit)
  const conduitsTriggered = useGameStore((state) => state.conduitsTriggered)
  const chargedConduits = useGameStore((state) => state.arenaConduits.filter((conduit) => conduit.active).length)
  const selectedDoctrine = useGameStore(
  (state) => state.selectedDoctrine || 'balanced'
)

const activeRunModifier = useGameStore(
  (state) => state.activeRunModifier || 'standard'
)
  const healthPercent = (health / maxHealth) * 100

  let tutorialTitle = 'FOLLOW THE CYAN SIGNAL'
  let tutorialDetail = 'Move with WASD or the arrow keys.'
  let tutorialKey = 'WASD'
  if (stage === 0 && tutorial.moved && !tutorial.sprinted) {
    tutorialTitle = 'SPRINT TO THE RELAY'
    tutorialDetail = 'Hold Shift while moving.'
    tutorialKey = 'SHIFT'
  } else if (stage === 0 && tutorial.sprinted) {
    tutorialTitle = 'BREACH RELAY ALPHA'
    tutorialDetail = 'Approach the terminal and interact.'
    tutorialKey = 'E'
  } else if (stage === 1 && !tutorial.attacked) {
    tutorialTitle = 'INITIATE THE LIGHT COMBO'
    tutorialDetail = 'Use left-click or J, then watch the enemy attack signals.'
    tutorialKey = 'LMB / J'
  } else if (stage === 1 && wave >= 2 && conduitsTriggered === 0) {
    tutorialTitle = 'OVERLOAD AN AETHER CONDUIT'
    tutorialDetail = 'Approach a charged cyan conduit and press E to stagger nearby Wardens.'
    tutorialKey = 'E'
  } else if (stage === 1) {
    tutorialTitle = 'READ THE ATTACK SIGNALS'
    tutorialDetail = 'Cyan: parry. Yellow: block or parry. Red: dodge.'
    tutorialKey = 'REACT'
  } else if (stage === 2 && mounted && !tutorial.boosted) {
    tutorialTitle = 'OPEN THE BOOST CAPACITOR'
    tutorialDetail = 'Hold Shift on the straight.'
    tutorialKey = 'SHIFT'
  } else if (stage === 2 && mounted && !tutorial.drifted) {
    tutorialTitle = 'DRIFT THE VECTOR SHIFT'
    tutorialDetail = 'Hold Space while steering at speed.'
    tutorialKey = 'SPACE'
  } else if (stage === 2) {
    tutorialTitle = 'CLEAR THE EXTRACTION GATES'
    tutorialDetail = `${checkpoint} / 4 gates cleared.`
    tutorialKey = 'GO'
  }

  if (inputDevice === 'gamepad') {
    if (stage === 0 && !tutorial.moved) { tutorialKey = 'LEFT STICK'; tutorialDetail = 'Move toward the cyan relay signal.' }
    else if (stage === 0 && !tutorial.sprinted) { tutorialKey = 'L3'; tutorialDetail = 'Click the left stick while moving.' }
    else if (stage === 0) { tutorialKey = 'A / B'; tutorialDetail = 'Approach Relay Alpha and interact.' }
    else if (stage === 1 && !tutorial.attacked) { tutorialKey = 'X'; tutorialDetail = 'Use X for a light strike. RB throws the Flux Disc.' }
    else if (stage === 1 && wave >= 2 && conduitsTriggered === 0) { tutorialKey = 'B'; tutorialDetail = 'Approach a charged conduit and press B to overload it.' }
    else if (stage === 1) { tutorialKey = 'LB / A'; tutorialDetail = 'Guard or parry with LB and dodge with A.' }
    else if (stage === 2 && mounted && !tutorial.boosted) { tutorialKey = 'RB'; tutorialDetail = 'Hold RB to boost on the straight.' }
    else if (stage === 2 && mounted && !tutorial.drifted) { tutorialKey = 'A'; tutorialDetail = 'Hold A while steering at speed to drift.' }
  }

  return (
    <>
      <aside className="hud-panel hud-panel--mission glass-panel vertical-mission-panel">
        <span className="eyebrow">CAMPAIGN // GENESIS BREACH</span>
        <h2>{objective.title}</h2>
        <div className="mission-row"><span className={`status-dot ${stage === 1 ? 'status-dot--alert' : ''}`} /><span>{objective.detail}</span></div>
        {stage === 1 && <div className="vertical-wave-readout"><span>FORMATION</span><strong>{Math.max(1, wave)} / 3</strong><small>{enemiesRemaining} ACTIVE</small></div>}
        <div className="story-stage-track vertical-stage-track">
          {['INFILTRATE', 'COMBAT', 'ESCAPE'].map((label, index) => <span key={label} className={stage >= index ? 'active' : ''}>{index + 1}</span>)}
        </div>
      </aside>

      <aside className="hud-panel hud-panel--telemetry glass-panel vertical-telemetry-panel">
        <QualityPanel />
        <div className="telemetry-row"><span>{mounted ? 'CYCLE VELOCITY' : 'OPERATOR VELOCITY'}</span><strong>{playerSpeed.toString().padStart(3, '0')} U/S</strong></div>
        <div className="telemetry-row"><span>{mounted ? 'ESCAPE TIME' : 'HOSTILES'}</span><strong>{mounted ? formatTime(verticalTime) : enemiesRemaining.toString().padStart(2, '0')}</strong></div>
        <div className="telemetry-row"><span>SCORE</span><strong>{score.toLocaleString('en-US')}</strong></div>
      </aside>

      <aside className="combat-status glass-panel vertical-status-panel">
        <div className="combat-status__label"><span>{mounted ? 'CYCLE INTEGRITY' : 'OPERATOR INTEGRITY'}</span><strong>{health}%</strong></div>
        <div className="health-track"><div className="health-fill" style={{ width: `${healthPercent}%` }} /></div>
        {mounted ? (
          <>
            <div className="drive-meter-label"><span>BOOST CAPACITOR</span><strong>{Math.round(boostEnergy)}%</strong></div>
            <div className="boost-track"><div className="boost-fill" style={{ width: `${boostEnergy}%` }} /></div>
            <div className="race-drive-flags"><span className={driftActive ? 'active' : ''}>DRIFT {driftActive ? 'ENGAGED' : 'READY'}</span><span>IMPACTS {collisions}</span></div>
          </>
        ) : (
          <div className="weapon-row"><span>{stage === 1 ? 'FLUX DISC' : 'MISSION LINK'}</span><strong className={`disc-state disc-state--${discState}`}>{stage === 1 ? discState.toUpperCase() : 'STABLE'}</strong></div>
        )}
      </aside>

      <div className="tutorial-callout glass-panel">
        <kbd>{tutorialKey}</kbd><div><strong>{tutorialTitle}</strong><span>{tutorialDetail}</span></div>
      </div>

      {stage === 1 && wave === 3 && commander?.alive && commander.active !== false && (
        <div className={`boss-health-card boss-health-card--phase-${bossPhase} glass-panel`}>
          <div><span>GRID WARDEN // PHASE {bossPhase}</span><strong>{bossPhase === 1 ? 'VECTOR BARRAGE' : bossPhase === 2 ? 'CLOSE ASSAULT' : 'TERMINAL OVERDRIVE'}</strong><small>{Math.ceil(commander.hp)} / {commander.maxHp}</small></div>
          <div className="boss-health-track"><i style={{ width: `${Math.max(0, (commander.hp / commander.maxHp) * 100)}%` }} /></div>
          <div className="boss-phase-row"><span className={bossPhase >= 1 ? 'active' : ''}>I</span><span className={bossPhase >= 2 ? 'active' : ''}>II</span><span className={bossPhase >= 3 ? 'active' : ''}>III</span></div>
        </div>
      )}
      {stage === 1 && (
        <>
          <div className="combat-mastery-chip glass-panel">
            <span>PARRIES <strong>{combatParries}</strong></span><span>DODGES <strong>{combatDodges}</strong></span><span>MAX CHAIN <strong>x{combatMaxCombo}</strong></span>
          </div>
          <div className="squad-intel-chip squad-intel-chip--vertical glass-panel">
            <span>TACTIC <strong>{squadTactic.toUpperCase()}</strong></span>
            <span>THREAT <strong>{squadThreat}%</strong></span>
            <span>CHANNELS <strong>{attackTokenLimit}</strong></span>
            <span>CONDUITS <strong>{chargedConduits}/4</strong></span>
          </div>
        </>
      )}
      <div className="campaign-time-chip glass-panel"><span>MISSION</span><strong>{formatTime(missionTime)}</strong></div>
      <div className="run-loadout-chip glass-panel"><span>{selectedDoctrine.toUpperCase()}</span><strong>{activeRunModifier === 'standard' ? 'STANDARD' : activeRunModifier.replace('-', ' ').toUpperCase()}</strong></div>
      {stage === 1 && <div className="reticle" aria-hidden="true"><span /><span /></div>}
      
    </>
  )
}

export default function HUD() {
  const gameMode = useGameStore((state) => state.gameMode)
  const damageSerial = useGameStore((state) => state.damageSerial)

  return (
    <section className={`hud-layer hud-layer--${gameMode || 'idle'}`} aria-label="Game heads-up display">
      {damageSerial > 0 && <div key={damageSerial} className="damage-flash" />}
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />
      {gameMode === 'vertical' ? <VerticalHUD /> : gameMode === 'race' ? <RaceHUD /> : gameMode === 'story' ? <StoryHUD /> : <CombatHUD />}
      <MobileControls mode={gameMode} />
    </section>
  )
}
