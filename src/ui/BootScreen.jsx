import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { playUi, unlockAudio } from '../audio/audioEngine.js'
import { preloadAssetsForMode } from '../game/assets/ImportedAssets.jsx'
import { preloadCoreAssets, recommendQuality } from '../core/preloadCoreAssets.ts'
import { GAME_IDENTITY } from '../core/gameIdentity.ts'
import { DOCTRINES, GENESIS_CHALLENGES, RUN_MODIFIERS } from '../core/progression.js'

const stages = [
  [0, 'INITIALIZING RENDERER'],
  [18, 'LOADING CIPHER RUNNER'],
  [44, 'PREPARING COMBAT SYSTEM'],
  [68, 'SYNCING GENESIS VAULT'],
  [88, 'VERIFYING ACCESSIBILITY'],
  [99, 'GRID READY'],
]

export default function BootScreen() {
  const status = useGameStore((state) => state.status)
  const progress = useGameStore((state) => state.bootProgress)
  const setStatus = useGameStore((state) => state.setStatus)
  const setBootProgress = useGameStore((state) => state.setBootProgress)
  const startProtocol = useGameStore((state) => state.startProtocol)
  const openSettings = useGameStore((state) => state.openSettings)
  const openReleasePanel = useGameStore((state) => state.openReleasePanel)
  const unlockStoreAudio = useGameStore((state) => state.unlockAudio)
  const setQuality = useGameStore((state) => state.setQuality)
  const hasCheckpoint = useGameStore((state) => state.hasCheckpoint)
  const checkpointSavedAt = useGameStore((state) => state.checkpointSavedAt)
  const loadCheckpoint = useGameStore((state) => state.loadCheckpoint)
  const clearCheckpoint = useGameStore((state) => state.clearCheckpoint)
  const profile = useGameStore((state) => state.profile)
  const selectedDoctrine = useGameStore((state) => state.selectedDoctrine)
  const activeRunModifier = useGameStore((state) => state.activeRunModifier)
  const setSelectedDoctrine = useGameStore((state) => state.setSelectedDoctrine)
  const setRunModifier = useGameStore((state) => state.setRunModifier)
  const [loadWarning, setLoadWarning] = useState('')
  const [recommended, setRecommended] = useState('medium')
  const [matrixOpen, setMatrixOpen] = useState(false)

  useEffect(() => {
    if (status !== 'booting') return undefined
    let cancelled = false
    const quality = recommendQuality()
    setRecommended(quality)
    try {
      if (!localStorage.getItem('aether-grid-quality-detected')) {
        setQuality(quality)
        localStorage.setItem('aether-grid-quality-detected', '1')
      }
    } catch {
      // Private browsing may block local storage.
    }

    preloadCoreAssets((value) => {
      if (!cancelled) setBootProgress(Math.max(2, value * 100))
    }).catch(() => {
      if (!cancelled) setLoadWarning('Some assets will load when the mission starts.')
    }).finally(() => {
      if (!cancelled) {
        setBootProgress(100)
        setStatus('ready')
      }
    })
    return () => { cancelled = true }
  }, [setBootProgress, setQuality, setStatus, status])

  const currentStage = useMemo(
    () => [...stages].reverse().find(([threshold]) => progress >= threshold)?.[1] || stages[0][1],
    [progress],
  )

  const launch = (mode, resetProgress = false) => {
    if (resetProgress) clearCheckpoint()
    preloadAssetsForMode(mode)
    unlockAudio().then(() => playUi('confirm'))
    unlockStoreAudio()
    startProtocol(mode)
  }

  return (
    <section className="boot-screen" aria-label="Aether Grid main menu">
      <div className="boot-grid" />
      <div className="boot-vignette" />
      <header className="boot-brand">
        <span className="eyebrow">SAMMIUM TECH // ORIGINAL CYBER-GRID ACTION GAME</span>
        <h1>{GAME_IDENTITY.title}</h1>
        <p>{GAME_IDENTITY.subtitle}</p>
        <div className="release-version-badge"><span>V{GAME_IDENTITY.version}</span><b>{GAME_IDENTITY.build}</b></div>
      </header>

      <div className="profile-summary-strip glass-panel" aria-label="Operator progression summary">
        <div><span>OPERATOR LEVEL</span><strong>{profile.level}</strong></div>
        <div><span>CORE FRAGMENTS</span><strong>{profile.coreFragments.toLocaleString('en-US')}</strong></div>
        <div><span>BEST RANK</span><strong>{profile.bestRank}</strong></div>
        <div><span>RUNS</span><strong>{profile.runsCompleted}</strong></div>
        <div className="profile-xp"><span>MASTERY</span><i><b style={{ width: `${((profile.xp % 500) / 500) * 100}%` }} /></i><small>{profile.xp % 500} / 500 XP</small></div>
      </div>

      <div className="boot-console glass-panel">
        <div className="boot-console__topline"><span>{currentStage}</span><span>{Math.floor(progress).toString().padStart(3, '0')}%</span></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

        {status === 'ready' ? (
          <div className="protocol-select core-menu">
            {hasCheckpoint && (
              <button className="enter-button protocol-card protocol-card--primary protocol-card--continue" type="button" onClick={() => { unlockAudio(); unlockStoreAudio(); loadCheckpoint() }}>
                <span>CONTINUE</span><small>{checkpointSavedAt ? `CHECKPOINT // ${new Date(checkpointSavedAt).toLocaleString()}` : 'RESUME GENESIS BREACH'}</small>
              </button>
            )}

            <button className={`enter-button protocol-card ${hasCheckpoint ? 'protocol-card--new-game' : 'protocol-card--primary'} protocol-card--vertical`} type="button" onMouseEnter={() => preloadAssetsForMode('vertical')} onFocus={() => preloadAssetsForMode('vertical')} onClick={() => launch('vertical', true)}>
              <span>NEW GAME</span><small>{GAME_IDENTITY.campaign} // INFILTRATION // COMBAT // ESCAPE</small>
            </button>

            <div className="protocol-secondary-grid protocol-secondary-grid--three">
              <button className="protocol-card protocol-card--secondary" type="button" onMouseEnter={() => preloadAssetsForMode('story')} onFocus={() => preloadAssetsForMode('story')} onClick={() => launch('story')}><span>MISSION SELECT</span><small>SIGNAL FRACTURE // BRANCHING STORY</small></button>
              <button className="protocol-card protocol-card--secondary" type="button" onMouseEnter={() => preloadAssetsForMode('combat')} onFocus={() => preloadAssetsForMode('combat')} onClick={() => launch('combat')}><span>ARENA</span><small>COMBOS // PARRY // FINISHERS</small></button>
              <button className="protocol-card protocol-card--secondary" type="button" onMouseEnter={() => preloadAssetsForMode('race')} onFocus={() => preloadAssetsForMode('race')} onClick={() => launch('race')}><span>VELOCITY TRIAL</span><small>FLUX CYCLE // RIVALS // AUTOPILOT</small></button>
            </div>

            <div className="boot-utility-row">
              <button className="boot-matrix-button" type="button" onClick={() => { playUi('confirm'); setMatrixOpen(true) }}>
                CHALLENGE MATRIX <span>{DOCTRINES[selectedDoctrine].label} // {RUN_MODIFIERS[activeRunModifier].label}</span>
              </button>
              <button className="boot-settings-button" type="button" onClick={() => { unlockAudio(); unlockStoreAudio(); openSettings() }}>SETTINGS & ACCESSIBILITY <span>RECOMMENDED QUALITY // {recommended.toUpperCase()}</span></button>
              <button className="boot-credits-button" type="button" onClick={() => openReleasePanel('credits')}>CREDITS</button>
            </div>
            {loadWarning && <p className="boot-warning">{loadWarning}</p>}
          </div>
        ) : <p className="boot-hint">Loading only the assets required for the opening mission…</p>}
      </div>

      {matrixOpen && (
        <div className="challenge-matrix-backdrop" role="dialog" aria-modal="true" aria-label="Challenge Matrix">
          <section className="challenge-matrix glass-panel">
            <header>
              <div><span className="eyebrow">PHASE 23 // REPLAY PROGRESSION</span><h2>CHALLENGE MATRIX</h2><p>Select one operator doctrine and one campaign modifier before starting Genesis Breach.</p></div>
              <button type="button" onClick={() => { playUi('cancel'); setMatrixOpen(false) }}>CLOSE</button>
            </header>

            <div className="challenge-matrix-columns">
              <div className="matrix-section">
                <div className="matrix-section-title"><span>01</span><div><strong>OPERATOR DOCTRINE</strong><small>PASSIVE PLAYSTYLE</small></div></div>
                <div className="doctrine-grid">
                  {Object.values(DOCTRINES).map((doctrine) => {
                    const unlocked = profile.level >= doctrine.unlockLevel
                    return (
                      <button
                        key={doctrine.id}
                        type="button"
                        disabled={!unlocked}
                        className={selectedDoctrine === doctrine.id ? 'active' : ''}
                        onClick={() => { if (setSelectedDoctrine(doctrine.id)) playUi('confirm') }}
                      >
                        <span>{doctrine.label}</span><small>{doctrine.detail}</small><b>{unlocked ? `LEVEL ${doctrine.unlockLevel}` : `LOCKED // LEVEL ${doctrine.unlockLevel}`}</b>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="matrix-section">
                <div className="matrix-section-title"><span>02</span><div><strong>RUN MODIFIER</strong><small>RISK // REWARD</small></div></div>
                <div className="modifier-grid">
                  {Object.values(RUN_MODIFIERS).map((modifier) => (
                    <button key={modifier.id} type="button" className={activeRunModifier === modifier.id ? 'active' : ''} onClick={() => { if (setRunModifier(modifier.id)) playUi('confirm') }}>
                      <span>{modifier.label}</span><small>{modifier.detail}</small><b>x{modifier.rewardMultiplier.toFixed(2)} REWARDS</b>
                    </button>
                  ))}
                </div>
              </div>

              <div className="matrix-section matrix-section--contracts">
                <div className="matrix-section-title"><span>03</span><div><strong>MISSION CONTRACTS</strong><small>REPEATABLE OBJECTIVES</small></div></div>
                <div className="contract-list">
                  {GENESIS_CHALLENGES.map((challenge) => {
                    const discovered = profile.completedChallengeIds.includes(challenge.id)
                    return <div key={challenge.id} className={discovered ? 'complete' : ''}><i>{discovered ? '✓' : '◇'}</i><span><strong>{challenge.label}</strong><small>{challenge.detail}</small></span><b>+{challenge.reward}</b></div>
                  })}
                </div>
              </div>
            </div>

            <footer><span>Selected: <strong>{DOCTRINES[selectedDoctrine].label}</strong> // <strong>{RUN_MODIFIERS[activeRunModifier].label}</strong></span><button type="button" onClick={() => { playUi('confirm'); setMatrixOpen(false) }}>CONFIRM LOADOUT</button></footer>
          </section>
        </div>
      )}

      <footer className="boot-footer">Aether Grid is an original Sammium Tech portfolio project. Verify third-party asset licenses before public release.</footer>
    </section>
  )
}
