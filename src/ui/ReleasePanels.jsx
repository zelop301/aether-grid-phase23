import { useState } from 'react'
import { CAPTURE_SHOTS, CREDITS, PORTFOLIO_COPY, PROTOCOLS, RELEASE } from '../release/releaseData.js'
import { playUi, unlockAudio } from '../audio/audioEngine.js'
import { useGameStore } from '../store/useGameStore.js'

function engageAudio(kind = 'confirm') {
  unlockAudio().then(() => playUi(kind))
  useGameStore.getState().unlockAudio()
}

function ReleaseButton({ children, className = '', onClick, tone = 'confirm' }) {
  return (
    <button
      type="button"
      className={`release-button ${className}`}
      onMouseEnter={() => playUi('hover')}
      onClick={() => {
        engageAudio(tone)
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

function ReleaseHeader({ eyebrow, title, description, onClose }) {
  return (
    <header className="release-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <button type="button" className="release-close" onClick={() => { playUi('cancel'); onClose() }}>
        CLOSE <kbd>ESC</kbd>
      </button>
    </header>
  )
}

export function ShowcasePanel() {
  const [copyState, setCopyState] = useState('COPY PORTFOLIO SUMMARY')
  const startProtocol = useGameStore((state) => state.startProtocol)
  const openReleasePanel = useGameStore((state) => state.openReleasePanel)
  const closeReleasePanel = useGameStore((state) => state.closeReleasePanel)

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_COPY)
      setCopyState('SUMMARY COPIED')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = PORTFOLIO_COPY
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      setCopyState('SUMMARY COPIED')
    }
    window.setTimeout(() => setCopyState('COPY PORTFOLIO SUMMARY'), 1800)
  }

  return (
    <div className="release-backdrop">
      <section className="release-console glass-panel release-console--showcase">
        <ReleaseHeader
          eyebrow={`${RELEASE.phase} // ${RELEASE.codename} // V${RELEASE.version}`}
          title="PROJECT SHOWCASE"
          description={RELEASE.summary}
          onClose={closeReleasePanel}
        />

        <div className="release-hero">
          <div className="release-mark" aria-hidden="true"><span>S</span><i /></div>
          <div>
            <span className="eyebrow">{RELEASE.studio} ORIGINAL</span>
            <h2>AETHER GRID</h2>
            <p>Designed and engineered by {RELEASE.creator} as a browser-native game development portfolio project.</p>
          </div>
        </div>

        <div className="release-metrics">
          {RELEASE.metrics.map((metric) => (
            <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>
          ))}
        </div>

        <div className="release-protocol-grid">
          {PROTOCOLS.map((protocol) => (
            <article key={protocol.id} className={`release-protocol release-protocol--${protocol.id}`}>
              <header><span>{protocol.kicker}</span><b>PHASE {protocol.phase}</b></header>
              <h3>{protocol.title}</h3>
              <p>{protocol.description}</p>
              <div className="release-tags">{protocol.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <ReleaseButton className="release-button--launch" onClick={() => startProtocol(protocol.id)}>
                LAUNCH {protocol.title}
              </ReleaseButton>
            </article>
          ))}
        </div>

        <div className="release-stack">
          <span className="eyebrow">TECHNOLOGY STACK</span>
          <div>{RELEASE.stack.map((item) => <span key={item}>{item}</span>)}</div>
        </div>

        <footer className="release-footer-actions">
          <ReleaseButton className="release-button--primary" onClick={() => openReleasePanel('capture')}>OPEN CAPTURE DECK</ReleaseButton>
          <ReleaseButton onClick={copySummary}>{copyState}</ReleaseButton>
          <ReleaseButton onClick={() => openReleasePanel('credits')}>VIEW CREDITS</ReleaseButton>
        </footer>
      </section>
    </div>
  )
}

export function CapturePanel() {
  const closeReleasePanel = useGameStore((state) => state.closeReleasePanel)
  const startProtocol = useGameStore((state) => state.startProtocol)
  const setPreference = useGameStore((state) => state.setPreference)

  const prepareShot = (shot) => {
    setPreference('photoFilter', shot.filter)
    startProtocol(shot.mode)
  }

  return (
    <div className="release-backdrop release-backdrop--capture">
      <section className="release-console glass-panel release-console--capture">
        <ReleaseHeader
          eyebrow="CAPTURE WORKFLOW"
          title="CAPTURE DECK"
          description="Use these repeatable shots for your project thumbnail, portfolio case study, social post, and demo reel. Press P during gameplay to enter Photo Mode."
          onClose={closeReleasePanel}
        />
        <div className="capture-grid">
          {CAPTURE_SHOTS.map((shot) => (
            <article key={shot.id} className="capture-card">
              <div className="capture-card__index">{shot.number}</div>
              <div>
                <span>{shot.mode.toUpperCase()} // {shot.filter.toUpperCase()} FILTER</span>
                <h2>{shot.title}</h2>
                <p>{shot.instruction}</p>
              </div>
              <ReleaseButton className="release-button--launch" onClick={() => prepareShot(shot)}>PREPARE SHOT</ReleaseButton>
            </article>
          ))}
        </div>
        <div className="capture-workflow">
          <span className="eyebrow">RECOMMENDED DEMO REEL ORDER</span>
          <p>Boot title → story exploration → hacking → Flux Disc combat → velocity boost → Central Core choice → project logo. Record at 1080p, use Low or Medium quality for stable frame pacing, and keep the final reel between 45 and 60 seconds.</p>
        </div>
      </section>
    </div>
  )
}

export function CreditsPanel() {
  const closeReleasePanel = useGameStore((state) => state.closeReleasePanel)
  const openReleasePanel = useGameStore((state) => state.openReleasePanel)
  return (
    <div className="release-backdrop release-backdrop--credits">
      <section className="release-console glass-panel release-console--credits">
        <ReleaseHeader
          eyebrow={`${RELEASE.phase} // ORIGINAL PRODUCTION CREDITS`}
          title="SYSTEM CREDITS"
          description="The game systems, story, interface, procedural effects, and synthesized audio are original portfolio work. Selected user-supplied 3D models are integrated and documented separately."
          onClose={closeReleasePanel}
        />
        <div className="credits-mark"><img src="./favicon.svg" alt="Aether Grid: Legacy Protocol" /></div>
        <div className="credits-list">
          {CREDITS.map(([role, name]) => <div key={role}><span>{role}</span><strong>{name}</strong></div>)}
        </div>
        <div className="credits-originality">
          <span className="eyebrow">ORIGINALITY STATEMENT</span>
          <p>Neon Protocol is inspired by the broad atmosphere of neon cyber-world cinema. Uploaded 3D models and textures are treated as user-supplied third-party assets; verify their licenses and required attribution before public or commercial release.</p>
        </div>
        <footer className="release-footer-actions">
          <ReleaseButton className="release-button--primary" onClick={() => openReleasePanel('showcase')}>PROJECT SHOWCASE</ReleaseButton>
          <ReleaseButton onClick={() => openReleasePanel('capture')}>CAPTURE DECK</ReleaseButton>
        </footer>
      </section>
    </div>
  )
}
