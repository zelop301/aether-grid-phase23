import { useGameStore } from '../store/useGameStore.js'

const GLYPHS = {
  1: { symbol: '◇', label: 'PRISM' },
  2: { symbol: '△', label: 'VECTOR' },
  3: { symbol: '○', label: 'ORBIT' },
  4: { symbol: '□', label: 'FRAME' },
}

function TransmissionPanel({ transmission, onContinue }) {
  if (!transmission) return null
  return (
    <div className="story-transmission glass-panel">
      <div className="story-transmission__speaker">
        <span>{transmission.speaker}</span>
        <small>SECURE CHANNEL</small>
      </div>
      <div>
        <span className="eyebrow">{transmission.title}</span>
        <p>{transmission.body}</p>
      </div>
      <button type="button" onClick={onContinue}>CONTINUE <kbd>ENTER</kbd></button>
    </div>
  )
}

function LogPanel({ log, stage, onContinue }) {
  if (!log) return null
  return (
    <div className="story-modal-backdrop">
      <div className="story-log-card glass-panel">
        <span className="eyebrow">RECOVERED MEMORY FRAGMENT</span>
        <h2>{log.title}</h2>
        <p>{log.body}</p>
        {stage === 2 && (
          <div className="story-threat-callout">
            <strong>AXIOM SECURITY DIRECTIVE</strong>
            <span>Memory breach confirmed. Warden programs released.</span>
          </div>
        )}
        <button className="enter-button" type="button" onClick={onContinue}>
          <span>{stage === 2 ? 'ENTER COMBAT' : 'ARCHIVE LOG'}</span>
          <small>PRESS ENTER</small>
        </button>
      </div>
    </div>
  )
}

function HackingPanel() {
  const pattern = useGameStore((state) => state.hackPattern)
  const input = useGameStore((state) => state.hackInput)
  const attempts = useGameStore((state) => state.hackAttempts)
  const submitHackNode = useGameStore((state) => state.submitHackNode)

  return (
    <div className="story-modal-backdrop story-modal-backdrop--hack">
      <div className="hack-console glass-panel">
        <div className="hack-header">
          <div>
            <span className="eyebrow">RELAY ALPHA // MANUAL OVERRIDE</span>
            <h2>DECODE THE SIGNAL PATH</h2>
          </div>
          <strong>ATTEMPTS {attempts.toString().padStart(2, '0')}</strong>
        </div>

        <p className="hack-instruction">Reproduce the four-node routing sequence. An incorrect node resets the current input.</p>

        <div className="hack-sequence" aria-label="Required sequence">
          {pattern.map((node, index) => (
            <div key={`${node}-${index}`} className={index < input.length ? 'matched' : ''}>
              <span>{GLYPHS[node].symbol}</span>
              <small>{index + 1}</small>
            </div>
          ))}
        </div>

        <div className="hack-progress-track">
          <div style={{ width: `${(input.length / pattern.length) * 100}%` }} />
        </div>

        <div className="hack-node-grid">
          {Object.entries(GLYPHS).map(([node, glyph]) => (
            <button key={node} type="button" onClick={() => submitHackNode(Number(node))}>
              <span>{glyph.symbol}</span>
              <strong>{glyph.label}</strong>
              <small>KEY {node}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChoicePanel() {
  const chooseStoryEnding = useGameStore((state) => state.chooseStoryEnding)
  return (
    <div className="story-modal-backdrop story-modal-backdrop--choice">
      <div className="choice-console glass-panel">
        <span className="eyebrow">CENTRAL CORE // FINAL AUTHORIZATION</span>
        <h2>WHO SHOULD CONTROL THE GRID?</h2>
        <p>The recovered archives can repair AXIOM under strict safeguards, or unlock every fragment and end centralized control.</p>
        <div className="choice-grid">
          <button type="button" onClick={() => chooseStoryEnding('stabilize')}>
            <span className="choice-code">PROTOCOL A</span>
            <strong>STABILIZE AXIOM</strong>
            <p>Preserve order, merge NOVA’s memories, and bind the Core to transparent rules.</p>
            <small>ENDING // COVENANT</small>
          </button>
          <button type="button" onClick={() => chooseStoryEnding('liberate')}>
            <span className="choice-code">PROTOCOL B</span>
            <strong>LIBERATE THE FRAGMENTS</strong>
            <p>Open the Core, distribute authority, and allow every program to choose its own path.</p>
            <small>ENDING // DAWN</small>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StoryOverlay() {
  const gameMode = useGameStore((state) => state.gameMode)
  const status = useGameStore((state) => state.status)
  const modal = useGameStore((state) => state.storyModal)
  const transmission = useGameStore((state) => state.transmission)
  const activeLog = useGameStore((state) => state.activeLog)
  const storyStage = useGameStore((state) => state.storyStage)
  const nearbyTerminal = useGameStore((state) => state.nearbyTerminal)
  const interactWithStory = useGameStore((state) => state.interactWithStory)

  if (!['story', 'vertical'].includes(gameMode) || status !== 'running') return null

  return (
    <section className="story-overlay" aria-label="Story protocol interface">
      {!modal && nearbyTerminal && (
        <button className="interaction-prompt glass-panel" type="button" onClick={interactWithStory}>
          <kbd>E</kbd>
          <span>INTERACT</span>
          <strong>{nearbyTerminal.label}</strong>
        </button>
      )}
      {modal === 'transmission' && <TransmissionPanel transmission={transmission} onContinue={interactWithStory} />}
      {modal === 'log' && <LogPanel log={activeLog} stage={storyStage} onContinue={interactWithStory} />}
      {modal === 'hack' && <HackingPanel />}
      {modal === 'choice' && <ChoicePanel />}
    </section>
  )
}
