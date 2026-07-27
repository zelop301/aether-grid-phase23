import { useState } from 'react'
import { QUALITY_PRESETS, useGameStore } from '../store/useGameStore.js'
import { playUi, unlockAudio } from '../audio/audioEngine.js'
import { CapturePanel, CreditsPanel, ShowcasePanel } from './ReleasePanels.jsx'

function activateSound(kind = 'confirm') {
  unlockAudio().then(() => playUi(kind))
  useGameStore.getState().unlockAudio()
}

function ActionButton({ children, className = '', onClick, tone = 'confirm' }) {
  return (
    <button type="button" className={`system-action ${className}`} onMouseEnter={() => playUi('hover')} onClick={() => { activateSound(tone); onClick?.() }}>
      {children}
    </button>
  )
}

function Toggle({ label, detail, preference }) {
  const enabled = useGameStore((state) => state[preference])
  const togglePreference = useGameStore((state) => state.togglePreference)
  return (
    <button type="button" className={`setting-toggle ${enabled ? 'active' : ''}`} onClick={() => { activateSound(enabled ? 'cancel' : 'confirm'); togglePreference(preference) }}>
      <span><strong>{label}</strong><small>{detail}</small></span><i aria-hidden="true"><b /></i>
    </button>
  )
}

function Slider({ label, preference, min = 0, max = 1, step = 0.01, format = (value) => `${Math.round(value * 100)}%` }) {
  const value = useGameStore((state) => state[preference])
  const setPreference = useGameStore((state) => state.setPreference)
  return (
    <label className="setting-slider">
      <span><strong>{label}</strong><output>{format(value)}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => setPreference(preference, Number(event.target.value))} onPointerDown={() => activateSound('hover')} />
    </label>
  )
}

function ChoiceGroup({ label, preference, options }) {
  const value = useGameStore((state) => state[preference])
  const setPreference = useGameStore((state) => state.setPreference)
  return (
    <div className="setting-choice">
      <strong>{label}</strong>
      <div>{options.map((option) => (
        <button key={option.value} type="button" className={value === option.value ? 'active' : ''} onClick={() => { activateSound(); setPreference(preference, option.value) }}>
          <span>{option.label}</span><small>{option.detail}</small>
        </button>
      ))}</div>
    </div>
  )
}

function PausePanel() {
  const gameMode = useGameStore((state) => state.gameMode)
  const fps = useGameStore((state) => state.fps)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const openSettings = useGameStore((state) => state.openSettings)
  const enterPhotoMode = useGameStore((state) => state.enterPhotoMode)
  const restartMission = useGameStore((state) => state.restartMission)
  const returnToProtocolSelect = useGameStore((state) => state.returnToProtocolSelect)
  const saveCheckpoint = useGameStore((state) => state.saveCheckpoint)
  const loadCheckpoint = useGameStore((state) => state.loadCheckpoint)
  const hasCheckpoint = useGameStore((state) => state.hasCheckpoint)
  return (
    <div className="system-backdrop system-backdrop--pause">
      <section className="pause-console glass-panel">
        <header><span className="eyebrow">GAME PAUSED</span><h1>PAUSE</h1><p>{gameMode?.toUpperCase()} mission is safely suspended{fps ? ` // ${fps} FPS` : ''}.</p></header>
        <div className="pause-actions">
          <ActionButton className="system-action--primary" onClick={resumeGame}><strong>RESUME</strong><small>ESC</small></ActionButton>
          <ActionButton onClick={enterPhotoMode}><strong>PHOTO MODE</strong><small>P</small></ActionButton>
          <ActionButton onClick={openSettings}><strong>SETTINGS</strong><small>VIDEO // AUDIO // ACCESSIBILITY</small></ActionButton>
          <ActionButton onClick={saveCheckpoint}><strong>SAVE CHECKPOINT</strong><small>LOCAL BROWSER SAVE</small></ActionButton>
          {hasCheckpoint && <ActionButton onClick={loadCheckpoint}><strong>RESTART CHECKPOINT</strong><small>RESTORE LAST SAFE STATE</small></ActionButton>}
          <ActionButton onClick={restartMission}><strong>RESTART MISSION</strong><small>RESET CURRENT INSTANCE</small></ActionButton>
          <ActionButton tone="cancel" onClick={returnToProtocolSelect}><strong>MAIN MENU</strong><small>LEAVE CURRENT MISSION</small></ActionButton>
        </div>
        <footer><span>AETHER GRID SYSTEMS</span><strong>CHECKPOINT RECOVERY ONLINE</strong></footer>
      </section>
    </div>
  )
}

function SettingsPanel() {
  const closeSettings = useGameStore((state) => state.closeSettings)
  const muted = useGameStore((state) => state.muted)
  const togglePreference = useGameStore((state) => state.togglePreference)
  const quality = useGameStore((state) => state.quality)
  const autoQuality = useGameStore((state) => state.autoQuality)
  const setQuality = useGameStore((state) => state.setQuality)
  const setAutoQuality = useGameStore((state) => state.setAutoQuality)
  const fps = useGameStore((state) => state.fps)
  const [benchmarkStatus, setBenchmarkStatus] = useState('READY')
  const runBenchmark = () => {
    setBenchmarkStatus('SAMPLING')
    setAutoQuality(false)
    window.setTimeout(() => {
      const sampledFps = useGameStore.getState().fps
      const nextQuality = sampledFps >= 55 ? 'high' : sampledFps >= 38 ? 'medium' : 'low'
      setQuality(nextQuality)
      setBenchmarkStatus(`${nextQuality.toUpperCase()} // ${sampledFps} FPS`)
    }, 2500)
  }
  return (
    <div className="system-backdrop system-backdrop--settings">
      <section className="settings-console glass-panel">
        <header className="settings-header"><div><span className="eyebrow">GAME OPTIONS</span><h1>SETTINGS</h1></div><button type="button" className="settings-close" onClick={() => { playUi('cancel'); closeSettings() }}>CLOSE <kbd>ESC</kbd></button></header>
        <div className="settings-columns">
          <div className="settings-section">
            <div className="settings-section__title"><span>01</span><div><strong>AUDIO BUS</strong><small>PROCEDURAL SYNTH ENGINE</small></div></div>
            <Slider label="MASTER OUTPUT" preference="masterVolume" /><Slider label="AMBIENT SCORE" preference="musicVolume" /><Slider label="SYSTEM EFFECTS" preference="sfxVolume" />
            <button type="button" className={`mute-button ${muted ? 'active' : ''}`} onClick={() => { activateSound(muted ? 'confirm' : 'cancel'); togglePreference('muted') }}>{muted ? 'RESTORE AUDIO' : 'MUTE ALL CHANNELS'}</button>
          </div>
          <div className="settings-section">
            <div className="settings-section__title"><span>02</span><div><strong>RENDER CORE</strong><small>LIVE {fps} FPS TELEMETRY</small></div></div>
            <div className="quality-settings-grid"><button type="button" className={autoQuality ? 'active' : ''} onClick={() => { activateSound(); setAutoQuality(true) }}>AUTO</button>{Object.entries(QUALITY_PRESETS).map(([key, preset]) => <button key={key} type="button" className={!autoQuality && quality === key ? 'active' : ''} onClick={() => { activateSound(); setQuality(key) }}>{preset.label}</button>)}</div>
            <button type="button" className="benchmark-button" disabled={benchmarkStatus === 'SAMPLING'} onClick={() => { activateSound(); runBenchmark() }}><strong>RUN PERFORMANCE BENCHMARK</strong><span>{benchmarkStatus}</span></button>
            <Slider label="SCENE EXPOSURE" preference="exposure" min={0.72} max={1.38} step={0.02} format={(value) => value.toFixed(2)} />
            <Toggle label="SCANLINE MATRIX" detail="Subtle display texture" preference="scanlines" /><Toggle label="EDGE VIGNETTE" detail="Cinematic focus mask" preference="vignette" /><Toggle label="FILM GRAIN" detail="Animated signal noise" preference="filmGrain" />
          </div>
          <div className="settings-section">
            <div className="settings-section__title"><span>03</span><div><strong>ACCESSIBILITY</strong><small>OPERATOR COMFORT</small></div></div>
            <ChoiceGroup label="DIFFICULTY" preference="difficulty" options={[
              { value: 'explorer', label: 'EXPLORER', detail: 'Long parry window, reduced damage' },
              { value: 'standard', label: 'STANDARD', detail: 'Intended combat balance' },
              { value: 'master', label: 'MASTER', detail: 'Short parry window, higher damage' },
            ]} />
            <ChoiceGroup label="DRIVING ASSIST" preference="drivingAssist" options={[
              { value: 'off', label: 'OFF', detail: 'Manual recovery' },
              { value: 'light', label: 'LIGHT', detail: 'Gentle track correction' },
              { value: 'full', label: 'FULL', detail: 'Strong recovery assistance' },
            ]} />
            <Slider label="CAMERA FOLLOW RESPONSE" preference="cameraSensitivity" min={0.6} max={1.4} step={0.05} format={(value) => `${Math.round(value * 100)}%`} />
            <div className="controller-map-note"><strong>CONTROLLER</strong><span>Left stick move/steer • X/Y attack • A dodge/drift • LB guard • RB disc/boost • Start pause</span></div>
            <Toggle label="CONTEXT TUTORIALS" detail="Show controls when relevant" preference="tutorialEnabled" /><Toggle label="COMPACT HUD" detail="Hide persistent control panels" preference="compactHud" /><Toggle label="SHOW FPS" detail="Display performance counter" preference="showFps" /><Toggle label="SUBTITLES" detail="Keep dialogue text visible" preference="subtitles" /><Toggle label="REDUCED MOTION" detail="Limits interface animation" preference="reducedMotion" /><Toggle label="REDUCED FLASHING" detail="Softens rapid emissive pulses" preference="reducedFlashing" /><Toggle label="HIGH CONTRAST" detail="Strengthens HUD readability" preference="highContrast" /><Toggle label="CAMERA IMPACT" detail="Damage-only camera shake" preference="screenShake" /><Toggle label="HUD VISIBILITY" detail="Show gameplay interface" preference="hudVisible" />
          </div>
        </div>
        <footer className="settings-footer"><span>Preferences and checkpoints save locally in this browser.</span><strong>AUTO QUALITY STEPS DOWN AFTER SUSTAINED LOW FPS</strong></footer>
      </section>
    </div>
  )
}

function PhotoPanel() {
  const photoFilter = useGameStore((state) => state.photoFilter)
  const screenshotMessage = useGameStore((state) => state.screenshotMessage)
  const gameMode = useGameStore((state) => state.gameMode)
  const setPreference = useGameStore((state) => state.setPreference)
  const requestScreenshot = useGameStore((state) => state.requestScreenshot)
  const exitPhotoMode = useGameStore((state) => state.exitPhotoMode)
  return (
    <div className="photo-interface">
      <div className="photo-title"><span className="eyebrow">PHOTO MODE // CLEAN CAPTURE</span><strong>PHOTO MODE</strong></div>
      <section className="photo-console glass-panel">
        <span className="eyebrow">{gameMode?.toUpperCase()} FRAME PROFILE</span>
        <div className="photo-filter-grid">{['neutral', 'cyan', 'noir', 'amber'].map((filter) => <button key={filter} type="button" className={photoFilter === filter ? 'active' : ''} onClick={() => { playUi('hover'); setPreference('photoFilter', filter) }}>{filter}</button>)}</div>
        <p>Drag anywhere on the scene to orbit. Use the mouse wheel to zoom. Captures are named by protocol and filter.</p>
        <ActionButton className="system-action--primary photo-capture" onClick={requestScreenshot}><strong>CAPTURE PNG</strong><small>{screenshotMessage || 'CLEAN FRAME // NO HUD'}</small></ActionButton>
        <ActionButton tone="cancel" onClick={exitPhotoMode}><strong>EXIT PHOTO MODE</strong><small>ESC OR P</small></ActionButton>
      </section>
      <div className="photo-reticle" aria-hidden="true"><span /><span /><i>+</i></div>
    </div>
  )
}

export default function SystemOverlay() {
  const panel = useGameStore((state) => state.systemPanel)
  if (panel === 'pause') return <PausePanel />
  if (panel === 'settings') return <SettingsPanel />
  if (panel === 'photo') return <PhotoPanel />
  if (panel === 'showcase') return <ShowcasePanel />
  if (panel === 'capture') return <CapturePanel />
  if (panel === 'credits') return <CreditsPanel />
  return null
}
