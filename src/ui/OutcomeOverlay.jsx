import { useGameStore } from '../store/useGameStore.js'
import { calculateGenesisRank, RUN_MODIFIERS } from '../core/progression.js'

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds - minutes * 60
  return `${minutes.toString().padStart(2, '0')}:${remaining.toFixed(2).padStart(5, '0')}`
}

export default function OutcomeOverlay() {
  const status = useGameStore((state) => state.status)
  const gameMode = useGameStore((state) => state.gameMode)
  const score = useGameStore((state) => state.score)
  const raceTime = useGameStore((state) => state.raceTime)
  const bestLap = useGameStore((state) => state.bestLap)
  const racePosition = useGameStore((state) => state.racePosition)
  const collisions = useGameStore((state) => state.collisions)
  const storyEnding = useGameStore((state) => state.storyEnding)
  const recoveredLogs = useGameStore((state) => state.recoveredLogs)
  const verticalTime = useGameStore((state) => state.verticalTime)
  const verticalCheckpointIndex = useGameStore((state) => state.verticalCheckpointIndex)
  const verticalMissionTime = useGameStore((state) => state.verticalMissionTime)
  const health = useGameStore((state) => state.health)
  const combatParries = useGameStore((state) => state.combatParries)
  const combatDodges = useGameStore((state) => state.combatDodges)
  const combatBlocks = useGameStore((state) => state.combatBlocks)
  const combatDamageTaken = useGameStore((state) => state.combatDamageTaken)
  const combatMaxCombo = useGameStore((state) => state.combatMaxCombo)
  const conduitsTriggered = useGameStore((state) => state.conduitsTriggered)
  const missionRewards = useGameStore((state) => state.missionRewards)
  const profile = useGameStore((state) => state.profile)
  const activeRunModifier = useGameStore((state) => state.activeRunModifier)
  const selectedDoctrine = useGameStore((state) => state.selectedDoctrine)
  const restartMission = useGameStore((state) => state.restartMission)
  const loadCheckpoint = useGameStore((state) => state.loadCheckpoint)
  const hasCheckpoint = useGameStore((state) => state.hasCheckpoint)
  const returnToProtocolSelect = useGameStore((state) => state.returnToProtocolSelect)
  const completed = status === 'mission_complete'
  const raceMode = gameMode === 'race'
  const storyMode = gameMode === 'story'
  const verticalMode = gameMode === 'vertical'
  const missionRank = verticalMode && completed
    ? missionRewards?.rank || calculateGenesisRank({
        health,
        collisions,
        verticalMissionTime,
        score,
        combatParries,
        combatMaxCombo,
        combatDamageTaken,
        conduitsTriggered,
      })
    : '--'

  const reportLabel = verticalMode
    ? 'GENESIS BREACH // MISSION REPORT'
    : storyMode
    ? 'SECTOR 04 // STORY REPORT'
    : raceMode
      ? 'SECTOR 03 // VELOCITY REPORT'
      : 'SECTOR 02 // COMBAT REPORT'

  const title = completed
    ? verticalMode
      ? 'GENESIS BREACH SECURED'
      : storyMode
      ? storyEnding?.title || 'SIGNAL FRACTURE RESOLVED'
      : raceMode
        ? 'CIRCUIT CONQUERED'
        : 'PROTOCOL SECURED'
    : verticalMode
      ? 'EXTRACTION LINK TERMINATED'
      : storyMode
      ? 'OPERATOR LINK TERMINATED'
      : raceMode
        ? 'CYCLE LINK FRACTURED'
        : 'OPERATOR DEREZZED'

  const summary = completed
    ? verticalMode
      ? `Relay breach, three combat formations, mini-boss, and four-gate extraction completed in ${formatTime(verticalMissionTime)}.`
      : storyMode
      ? storyEnding?.summary || 'The Central Core accepted your final authorization.'
      : raceMode
        ? `Two laps complete. You crossed the final gate in position ${racePosition}.`
        : 'All rogue sentinels have been neutralized. The Central Core is stable.'
    : verticalMode
      ? 'The integrated mission ended before the extraction route could be secured.'
      : storyMode
      ? 'The mission ended before the memory lattice could be secured. NOVA’s signal has gone silent.'
      : raceMode
        ? 'The cycle lost structural integrity before the velocity trial was completed.'
        : 'Your combat link collapsed before the hostile programs were contained.'

  return (
    <section className={`outcome-overlay ${completed ? 'outcome-overlay--success' : 'outcome-overlay--failure'} ${storyMode ? 'outcome-overlay--story' : ''}`}>
      <div className="outcome-card glass-panel">
        <span className="eyebrow">{reportLabel}</span>
        <h1>{title}</h1>
        <p>{summary}</p>

        {verticalMode && (
          <>
            <div className="race-result-grid vertical-result-grid">
              <div><span>MISSION TIME</span><strong>{formatTime(verticalMissionTime)}</strong></div>
              <div><span>MISSION RANK</span><strong className="mission-rank">{missionRank}</strong></div>
              <div><span>ESCAPE TIME</span><strong>{formatTime(verticalTime)}</strong></div>
              <div><span>GATES</span><strong>{verticalCheckpointIndex} / 4</strong></div>
              <div><span>IMPACTS</span><strong>{collisions}</strong></div>
            </div>
            <div className="combat-performance-grid">
              <div><span>PERFECT PARRIES</span><strong>{combatParries}</strong></div>
              <div><span>PHASE DODGES</span><strong>{combatDodges}</strong></div>
              <div><span>GUARD IMPACTS</span><strong>{combatBlocks}</strong></div>
              <div><span>MAX CHAIN</span><strong>x{combatMaxCombo}</strong></div>
              <div><span>DAMAGE TAKEN</span><strong>{combatDamageTaken}</strong></div>
              <div><span>CONDUIT OVERLOADS</span><strong>{conduitsTriggered}</strong></div>
            </div>
            <div className="run-configuration-summary">
              <div><span>DOCTRINE</span><strong>{selectedDoctrine.toUpperCase()}</strong></div>
              <div><span>MODIFIER</span><strong>{RUN_MODIFIERS[activeRunModifier]?.label || 'STANDARD LINK'}</strong></div>
              <div><span>REWARD RATE</span><strong>x{(RUN_MODIFIERS[activeRunModifier]?.rewardMultiplier || 1).toFixed(2)}</strong></div>
            </div>
            {completed && missionRewards && (
              <section className="mission-reward-panel">
                <header><div><span>OPERATOR PROGRESSION</span><strong>{missionRewards.leveledUp ? `LEVEL UP // ${missionRewards.newLevel}` : `LEVEL ${profile.level}`}</strong></div><div><span>CORE FRAGMENTS</span><strong>+{missionRewards.fragmentsEarned}</strong></div><div><span>MASTERY XP</span><strong>+{missionRewards.xpEarned}</strong></div></header>
                <div className="mission-contract-results">
                  {missionRewards.challenges.map((challenge) => (
                    <div key={challenge.id} className={challenge.completed ? 'complete' : ''}>
                      <i>{challenge.completed ? '✓' : '×'}</i><span><strong>{challenge.label}</strong><small>{challenge.detail}</small></span><b>{challenge.completed ? `+${challenge.reward}` : 'MISSED'}</b>
                    </div>
                  ))}
                </div>
                <footer><span>TOTAL FRAGMENTS</span><strong>{profile.coreFragments.toLocaleString('en-US')}</strong><span>BEST RANK</span><strong>{profile.bestRank}</strong></footer>
              </section>
            )}
          </>
        )}

        {storyMode && completed && storyEnding && (
          <div className="story-ending-code">
            <span>PERMANENT BRANCH WRITTEN</span>
            <strong>{storyEnding.code}</strong>
          </div>
        )}

        {storyMode && (
          <div className="race-result-grid story-result-grid">
            <div><span>ARCHIVES</span><strong>{recoveredLogs.length} / 2</strong></div>
            <div><span>WARDENS</span><strong>{completed ? 'CLEARED' : 'ACTIVE'}</strong></div>
            <div><span>CORE STATE</span><strong>{completed ? 'WRITTEN' : 'UNRESOLVED'}</strong></div>
          </div>
        )}

        {raceMode && (
          <div className="race-result-grid">
            <div><span>FINAL TIME</span><strong>{formatTime(raceTime)}</strong></div>
            <div><span>BEST LAP</span><strong>{bestLap === null ? '--:--.--' : formatTime(bestLap)}</strong></div>
            <div><span>IMPACTS</span><strong>{collisions}</strong></div>
          </div>
        )}

        <div className="outcome-score">
          <span>FINAL SCORE</span>
          <strong>{score.toLocaleString('en-US')}</strong>
        </div>
        <div className="outcome-actions">
          {!completed && hasCheckpoint && (
            <button type="button" className="enter-button outcome-checkpoint-button" onClick={loadCheckpoint}>
              <span>RESTART CHECKPOINT</span>
              <small>RESTORE LAST SAFE STATE</small>
            </button>
          )}
          <button type="button" className="enter-button" onClick={restartMission}>
            <span>{completed ? 'REPLAY CURRENT LOADOUT' : 'REINITIALIZE'}</span>
            <small>PRESS R OR ENTER</small>
          </button>
          <button type="button" className="protocol-card protocol-card--secondary outcome-menu-button" onClick={returnToProtocolSelect}>
            <span>{completed ? 'CHANGE LOADOUT' : 'PROTOCOL SELECT'}</span>
            <small>PRESS ESC</small>
          </button>
        </div>
      </div>
    </section>
  )
}
