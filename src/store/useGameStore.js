import { create } from 'zustand'
import {
  CYCLE_SPAWN,
  CYCLE_SPAWN_HEADING,
  LAPS_TO_WIN,
  RIVAL_BLUEPRINTS,
  TOTAL_CHECKPOINTS,
} from '../game/race/raceConfig.js'
import {
  DOCTRINES,
  RUN_MODIFIERS,
  createDefaultProfile,
  resolveGenesisRewards,
  sanitizeProfile,
} from '../core/progression.js'

const emptyInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  drift: false,
  block: false,
}

const ENEMY_BLUEPRINTS = [
  { id: 'striker-01', type: 'striker', label: 'WARDEN STRIKER', position: [9, 0.1, 2], maxHp: 55, wave: 1 },
  { id: 'striker-02', type: 'striker', label: 'WARDEN STRIKER', position: [-9, 0.1, 1], maxHp: 55, wave: 1 },
  { id: 'disc-guard-01', type: 'disc_guard', label: 'VECTOR ARCHER', position: [15, 0.1, 15], maxHp: 72, wave: 2 },
  { id: 'defender-01', type: 'defender', label: 'BULWARK', position: [-15, 0.1, 14], maxHp: 112, wave: 2 },
  { id: 'hunter-01', type: 'hunter', label: 'PHASE HUNTER', position: [0, 0.1, -18], maxHp: 88, wave: 2 },
  { id: 'commander-01', type: 'commander', label: 'GRID WARDEN', position: [0, 0.1, -10], maxHp: 220, wave: 3 },
]

export const ENEMY_IDS = ENEMY_BLUEPRINTS.map((enemy) => enemy.id)

export const ARENA_CONDUIT_BLUEPRINTS = [
  { id: 'conduit-ne', label: 'AETHER CONDUIT NE', position: [12, 0.08, 11] },
  { id: 'conduit-nw', label: 'AETHER CONDUIT NW', position: [-12, 0.08, 11] },
  { id: 'conduit-se', label: 'AETHER CONDUIT SE', position: [12, 0.08, -12] },
  { id: 'conduit-sw', label: 'AETHER CONDUIT SW', position: [-12, 0.08, -12] },
]

export const ARENA_CONDUIT_IDS = ARENA_CONDUIT_BLUEPRINTS.map((conduit) => conduit.id)

const STORY_TERMINALS = [
  { id: 'relay-alpha', type: 'relay', position: [0, 0.05, -16], label: 'RELAY ALPHA' },
  { id: 'archive-echo', type: 'archive', position: [-19, 0.05, 5], label: 'ARCHIVE ECHO' },
  { id: 'archive-lyra', type: 'archive', position: [18, 0.05, 8], label: 'ARCHIVE LYRA' },
  { id: 'archive-orion', type: 'archive', position: [3, 0.05, 22], label: 'ARCHIVE ORION' },
  { id: 'core-choice', type: 'core', position: [0, 0.05, 0], label: 'AXIOM CORE' },
]

export const STORY_TERMINAL_IDS = STORY_TERMINALS.map((terminal) => terminal.id)

const STORY_LOGS = {
  'archive-echo': { title: 'ECHO // 07', body: 'The wardens were not corrupted. They were ordered to erase every program that remembered the world before AXIOM.' },
  'archive-lyra': { title: 'LYRA // 12', body: 'A second intelligence survives beneath the relay lattice. It calls itself NOVA and refuses every command to dominate.' },
  'archive-orion': { title: 'ORION // 03', body: 'The Core can be stabilized, preserving order, or opened, returning choice to every surviving fragment.' },
}

const STORY_HACK_PATTERN = [2, 4, 1, 3]

export const VERTICAL_ESCAPE_CHECKPOINTS = [
  { id: 'escape-01', position: [0, 0.08, -25], label: 'TUNNEL ENTRY' },
  { id: 'escape-02', position: [-11, 0.08, -39], label: 'VECTOR SHIFT' },
  { id: 'escape-03', position: [10, 0.08, -53], label: 'SECURITY BREAK' },
  { id: 'escape-04', position: [0, 0.08, -69], label: 'EXTRACTION GATE' },
]

export const VERTICAL_CYCLE_SPAWN = [0, 0.08, -10]
export const VERTICAL_CYCLE_HEADING = Math.PI

function createTutorialProgress() {
  return { moved: false, sprinted: false, interacted: false, attacked: false, boosted: false, drifted: false }
}

function verticalObjective(stage, checkpoint = 0) {
  if (stage === 0) return { title: 'INFILTRATE RELAY ALPHA', detail: 'Follow the cyan signal and breach the northern relay.' }
  if (stage === 1) return { title: 'BREAK THE WARDEN LINE', detail: 'Read the attack telegraphs and neutralize six specialized Blackguards.' }
  if (stage === 2) return { title: 'ESCAPE THE GRID', detail: `${checkpoint} / ${VERTICAL_ESCAPE_CHECKPOINTS.length} extraction gates cleared` }
  return { title: 'GENESIS BREACH COMPLETE', detail: 'Relay data secured. Extraction confirmed.' }
}

function combatEnabled(state) {
  return state.gameMode === 'combat'
    || (state.gameMode === 'story' && state.storyStage === 2)
    || (state.gameMode === 'vertical' && state.verticalStage === 1)
}

function nearestAliveEnemy(state, direction = 1) {
  const alive = state.enemies.filter((enemy) => enemy.alive && enemy.active !== false)
  if (!alive.length) return null
  if (state.lockOnTargetId) {
    const currentIndex = alive.findIndex((enemy) => enemy.id === state.lockOnTargetId)
    if (currentIndex >= 0) return alive[(currentIndex + direction + alive.length) % alive.length]
  }
  let nearest = null
  let nearestDistance = Infinity
  for (const enemy of alive) {
    const dx = enemy.position[0] - state.playerPosition[0]
    const dz = enemy.position[2] - state.playerPosition[2]
    const distance = dx * dx + dz * dz
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = enemy
    }
  }
  return nearest
}

function createStoryTerminals() {
  return STORY_TERMINALS.map((terminal) => ({ ...terminal, completed: false }))
}

function storyObjective(stage, archivesRecovered = 0) {
  if (stage === 0) return { title: 'RESTORE RELAY ALPHA', detail: 'Reach the northern relay and establish a secure link.' }
  if (stage === 1) return { title: 'RECOVER MEMORY ARCHIVES', detail: `${archivesRecovered} / 2 fragments recovered` }
  if (stage === 2) return { title: 'SURVIVE THE WARDEN RESPONSE', detail: 'Neutralize the awakened security programs.' }
  if (stage === 3) return { title: "DECIDE THE GRID'S FUTURE", detail: 'Return to the Central Core and choose a protocol.' }
  return { title: 'SIGNAL FRACTURE COMPLETE', detail: 'A permanent branch has been written.' }
}

const PICKUP_BLUEPRINTS = [
  { id: 'repair-01', position: [-8, 0.6, 10] },
  { id: 'repair-02', position: [9, 0.6, -12] },
]

export const PICKUP_IDS = PICKUP_BLUEPRINTS.map((pickup) => pickup.id)

function createEnemies(verticalMode = false) {
  return ENEMY_BLUEPRINTS.map((enemy) => ({
    ...enemy,
    active: !verticalMode || enemy.wave === 1,
    spawnPosition: [...enemy.position],
    position: [...enemy.position],
    hp: enemy.maxHp,
    alive: true,
    hitSerial: 0,
    staggerSerial: 0,
    staggerUntil: 0,
  }))
}

function createPickups() {
  return PICKUP_BLUEPRINTS.map((pickup) => ({ ...pickup, active: true }))
}

function createArenaConduits() {
  return ARENA_CONDUIT_BLUEPRINTS.map((conduit) => ({
    ...conduit,
    active: true,
    readyAt: 0,
    pulseSerial: 0,
  }))
}

function createRivalProgress() {
  return Object.fromEntries(RIVAL_BLUEPRINTS.map((rival) => [rival.id, (rival.startOffset / (Math.PI * 2)) * TOTAL_CHECKPOINTS]))
}

export const QUALITY_PRESETS = {
  low: {
    label: 'LOW',
    dpr: [0.55, 0.85],
    particles: 36,
    towers: 18,
    shadows: false,
    lightCount: 2,
    trailSegments: 22,
    assetDetail: 'minimal',
  },
  medium: {
    label: 'MED',
    dpr: [0.72, 1.05],
    particles: 82,
    towers: 28,
    shadows: false,
    lightCount: 4,
    trailSegments: 36,
    assetDetail: 'balanced',
  },
  high: {
    label: 'HIGH',
    dpr: [0.9, 1.3],
    particles: 150,
    towers: 38,
    shadows: true,
    lightCount: 6,
    trailSegments: 52,
    assetDetail: 'full',
  },
}


const QUALITY_ORDER = ['low', 'medium', 'high']

const DEFAULT_PREFERENCES = {
  masterVolume: 0.82,
  musicVolume: 0.42,
  sfxVolume: 0.78,
  muted: false,
  autoQuality: true,
  exposure: 1.08,
  scanlines: true,
  vignette: true,
  filmGrain: false,
  highContrast: false,
  reducedMotion: false,
  screenShake: true,
  hudVisible: true,
  photoFilter: 'cyan',
  difficulty: 'standard',
  tutorialEnabled: true,
  compactHud: true,
  showFps: false,
  subtitles: true,
  reducedFlashing: false,
  drivingAssist: 'light',
  cameraSensitivity: 1,
}

function loadPreferences() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES }
  try {
    const saved = JSON.parse(localStorage.getItem('aether-grid-settings-v3') || '{}')
    return {
      ...DEFAULT_PREFERENCES,
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
      ...saved,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function persistPreferences(state) {
  if (typeof window === 'undefined') return
  try {
    const data = Object.fromEntries(Object.keys(DEFAULT_PREFERENCES).map((key) => [key, state[key]]))
    localStorage.setItem('aether-grid-settings-v3', JSON.stringify(data))
  } catch {
    // Persistence is optional and may be blocked by the browser.
  }
}

const PROFILE_KEY = 'aether-grid-profile-v1'

function loadProfile() {
  if (typeof window === 'undefined') return createDefaultProfile()
  try {
    return sanitizeProfile(JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'))
  } catch {
    return createDefaultProfile()
  }
}

function persistProfile(profile) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(sanitizeProfile(profile)))
  } catch {
    // Progression remains available for the current session when storage is blocked.
  }
}

const CHECKPOINT_KEY = 'aether-grid-checkpoint-v3'

function validateCheckpoint(data) {
  if (!data || data.version !== 3 || !['race', 'combat', 'story', 'vertical'].includes(data.gameMode)) return null
  if (!Array.isArray(data.playerPosition) || data.playerPosition.length !== 3 || data.playerPosition.some((value) => !Number.isFinite(value))) return null
  if (!Array.isArray(data.enemies) || !Array.isArray(data.pickups)) return null
  const allowedKeys = [
    'version', 'savedAt', 'gameMode', 'health', 'maxHealth', 'score', 'combo', 'playerPosition', 'playerHeading',
    'enemies', 'pickups', 'combatEnergy', 'resolve', 'raceStatus', 'raceTime', 'lap', 'checkpointIndex',
    'collisions', 'lapTimes', 'bestLap', 'storyStage', 'storyObjective', 'storyTerminals', 'recoveredLogs',
    'storyChoice', 'verticalStage', 'verticalObjective', 'verticalMounted', 'verticalCheckpointIndex', 'verticalWave', 'verticalMissionTime',
    'verticalTime', 'verticalTutorial', 'bossPhase', 'combatParries', 'combatDodges', 'combatBlocks', 'combatDamageTaken', 'combatMaxCombo',
    'arenaConduits', 'conduitsTriggered', 'activeRunModifier', 'selectedDoctrine',
  ]
  const filtered = Object.fromEntries(allowedKeys.filter((key) => Object.hasOwn(data, key)).map((key) => [key, data[key]]))
  const safeNumber = (value, fallback, min, max) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
  return {
    ...filtered,
    version: 3,
    gameMode: data.gameMode,
    maxHealth: safeNumber(data.maxHealth, 100, 70, 110),
    health: safeNumber(data.health, 100, 1, safeNumber(data.maxHealth, 100, 70, 110)),
    score: safeNumber(data.score, 0, 0, 99_999_999),
    combo: safeNumber(data.combo, 0, 0, 99),
    combatEnergy: safeNumber(data.combatEnergy, 100, 0, 100),
    resolve: safeNumber(data.resolve, 0, 0, 100),
    lap: safeNumber(data.lap, 1, 1, LAPS_TO_WIN),
    checkpointIndex: safeNumber(data.checkpointIndex, 0, 0, TOTAL_CHECKPOINTS),
    verticalStage: safeNumber(data.verticalStage, 0, 0, 3),
    verticalCheckpointIndex: safeNumber(data.verticalCheckpointIndex, 0, 0, VERTICAL_ESCAPE_CHECKPOINTS.length),
    raceTime: safeNumber(data.raceTime, 0, 0, 86_400),
    verticalTime: safeNumber(data.verticalTime, 0, 0, 86_400),
    verticalWave: safeNumber(data.verticalWave, data.verticalStage === 1 ? 1 : 0, 0, 3),
    verticalMissionTime: safeNumber(data.verticalMissionTime, 0, 0, 86_400),
    bossPhase: safeNumber(data.bossPhase, 1, 1, 3),
    combatParries: safeNumber(data.combatParries, 0, 0, 999),
    combatDodges: safeNumber(data.combatDodges, 0, 0, 999),
    combatBlocks: safeNumber(data.combatBlocks, 0, 0, 999),
    combatDamageTaken: safeNumber(data.combatDamageTaken, 0, 0, 9999),
    combatMaxCombo: safeNumber(data.combatMaxCombo, 0, 0, 99),
    conduitsTriggered: safeNumber(data.conduitsTriggered, 0, 0, 999),
    arenaConduits: Array.isArray(data.arenaConduits)
      ? data.arenaConduits.filter((conduit) => ARENA_CONDUIT_IDS.includes(conduit?.id)).map((conduit) => ({
          ...conduit,
          position: Array.isArray(conduit.position) && conduit.position.length === 3 ? [...conduit.position] : [...ARENA_CONDUIT_BLUEPRINTS.find((item) => item.id === conduit.id).position],
          active: Boolean(conduit.active),
          readyAt: safeNumber(conduit.readyAt, 0, 0, Number.MAX_SAFE_INTEGER),
          pulseSerial: safeNumber(conduit.pulseSerial, 0, 0, 9999),
        }))
      : createArenaConduits(),
    collisions: safeNumber(data.collisions, 0, 0, 999),
    activeRunModifier: RUN_MODIFIERS[data.activeRunModifier] ? data.activeRunModifier : 'standard',
    selectedDoctrine: DOCTRINES[data.selectedDoctrine] ? data.selectedDoctrine : 'balanced',
    savedAt: typeof data.savedAt === 'string' ? data.savedAt : new Date().toISOString(),
  }
}

function loadStoredCheckpoint() {
  if (typeof window === 'undefined') return null
  try {
    return validateCheckpoint(JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null'))
  } catch {
    return null
  }
}

function createCheckpointPayload(state) {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    gameMode: state.gameMode,
    health: state.health,
    maxHealth: state.maxHealth,
    score: state.score,
    combo: state.combo,
    playerPosition: [...state.playerPosition],
    playerHeading: state.playerHeading,
    enemies: state.enemies.map((enemy) => ({ ...enemy, position: [...enemy.position], spawnPosition: [...enemy.spawnPosition] })),
    pickups: state.pickups.map((pickup) => ({ ...pickup, position: [...pickup.position] })),
    combatEnergy: state.combatEnergy,
    resolve: state.resolve,
    raceStatus: state.raceStatus,
    raceTime: state.raceTime,
    lap: state.lap,
    checkpointIndex: state.checkpointIndex,
    collisions: state.collisions,
    lapTimes: [...state.lapTimes],
    bestLap: state.bestLap,
    storyStage: state.storyStage,
    storyObjective: state.storyObjective,
    storyTerminals: state.storyTerminals.map((terminal) => ({ ...terminal, position: [...terminal.position] })),
    recoveredLogs: [...state.recoveredLogs],
    storyChoice: state.storyChoice,
    verticalStage: state.verticalStage,
    verticalObjective: state.verticalObjective,
    verticalMounted: state.verticalMounted,
    verticalCheckpointIndex: state.verticalCheckpointIndex,
    verticalTime: state.verticalTime,
    verticalWave: state.verticalWave,
    verticalMissionTime: state.verticalMissionTime,
    bossPhase: state.bossPhase,
    combatParries: state.combatParries,
    combatDodges: state.combatDodges,
    combatBlocks: state.combatBlocks,
    combatDamageTaken: state.combatDamageTaken,
    combatMaxCombo: state.combatMaxCombo,
    arenaConduits: state.arenaConduits.map((conduit) => ({ ...conduit, position: [...conduit.position] })),
    conduitsTriggered: state.conduitsTriggered,
    activeRunModifier: state.activeRunModifier,
    selectedDoctrine: state.selectedDoctrine,
    verticalTutorial: { ...state.verticalTutorial },
  }
}

const initialCheckpoint = loadStoredCheckpoint()
const initialProfile = loadProfile()

const initialPreferences = loadPreferences()

function chooseInitialQuality() {
  if (typeof navigator === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  return cores <= 4 || memory <= 4 ? 'low' : 'medium'
}

function missionReset(mode, state) {
  const raceMode = mode === 'race'
  const storyMode = mode === 'story'
  const verticalMode = mode === 'vertical'
  const doctrine = DOCTRINES[state.selectedDoctrine] || DOCTRINES.balanced
  const modifier = RUN_MODIFIERS[state.activeRunModifier] || RUN_MODIFIERS.standard
  const doctrineHealth = doctrine.id === 'sentinel' ? 110 : 100
  const maxHealth = modifier.id === 'fragile' ? 70 : doctrineHealth
  const pickups = createPickups().map((pickup) => modifier.id === 'null-repair' ? { ...pickup, active: false } : pickup)
  return {
    status: 'running',
    gameMode: mode,
    health: maxHealth,
    maxHealth,
    score: 0,
    combo: 0,
    enemies: createEnemies(verticalMode),
    pickups,
    playerPosition: raceMode ? [...CYCLE_SPAWN] : (storyMode || verticalMode) ? [0, 0.05, 24] : [0, 0.05, 10],
    playerHeading: raceMode ? CYCLE_SPAWN_HEADING : Math.PI,
    attackSerial: 0,
    discState: 'ready',
    combatRequestSerial: 0,
    combatRequest: null,
    combatAction: 'locomotion',
    combatPhase: 'idle',
    combatActionSerial: 0,
    combatComboStep: 0,
    combatEnergy: 100,
    resolve: doctrine.id === 'vanguard' ? 20 : 0,
    blockHeld: false,
    parryUntil: 0,
    dodgeUntil: 0,
    hitStopUntil: 0,
    lockOnTargetId: null,
    attackTokens: [],
    combatMessage: null,
    combatMessageUntil: 0,
    combatDodgeVector: [0, 1],
    damageSerial: 0,
    combatImpactSerial: 0,
    combatImpactKind: 'light',
    combatParries: 0,
    combatDodges: 0,
    combatBlocks: 0,
    combatDamageTaken: 0,
    combatMaxCombo: 0,
    bossPhase: 1,
    bossPhaseTransitionSerial: 0,
    squadTactic: verticalMode ? 'probe' : 'pressure',
    squadThreat: 0,
    attackTokenLimit: (state.difficulty === 'explorer' ? 1 : 2) + (modifier.id === 'overdrive' ? 1 : 0),
    tacticSerial: 0,
    arenaConduits: createArenaConduits(),
    conduitsTriggered: 0,
    lastDamageAt: 0,
    lastCollisionAt: 0,
    resetNonce: state.resetNonce + 1,
    hitEffects: [],
    input: { ...emptyInput },
    playerSpeed: 0,
    cycleSpeed: 0,
    boostEnergy: doctrine.id === 'velocity' ? 115 : 100,
    driftActive: false,
    autopilotEnabled: false,
    autopilotLoops: 0,
    collisions: 0,
    raceStatus: raceMode ? 'countdown' : 'idle',
    raceCountdown: raceMode ? 3 : 0,
    raceTime: 0,
    lap: 1,
    checkpointIndex: 0,
    racePosition: 1,
    lapTimes: [],
    bestLap: null,
    rivalProgress: createRivalProgress(),
    storyStage: 0,
    storyObjective: storyObjective(0),
    storyTerminals: createStoryTerminals(),
    nearbyTerminal: null,
    storyModal: (storyMode || verticalMode) ? 'transmission' : null,
    transmission: storyMode
      ? { speaker: 'NOVA', title: 'UNAUTHORIZED SIGNAL', body: 'Operator, AXIOM has sealed the memory lattice. Restore Relay Alpha before the remaining archives are erased.' }
      : verticalMode
        ? { speaker: 'NOVA', title: 'GENESIS BREACH // INFILTRATION', body: 'Breach Relay Alpha, survive the Warden response, and escape through the transit sector.' }
        : null,
    hackPattern: [...STORY_HACK_PATTERN],
    hackInput: [],
    hackAttempts: 0,
    recoveredLogs: [],
    activeLog: null,
    storyChoice: null,
    storyEnding: null,
    verticalStage: 0,
    verticalWave: 0,
    verticalMissionTime: 0,
    verticalObjective: verticalObjective(0),
    verticalMounted: false,
    verticalCheckpointIndex: 0,
    verticalTime: 0,
    verticalTutorial: createTutorialProgress(),
    systemPanel: null,
    returnPanel: null,
    panelHistory: [],
    screenshotMessage: null,
    onboardingDismissed: !state.tutorialEnabled,
    missionRewards: null,
  }
}

export const useGameStore = create((set, get) => ({
  status: 'booting',
  gameMode: null,
  bootProgress: 0,
  quality: chooseInitialQuality(),
  fps: 60,
  lowFpsStreak: 0,
  highFpsStreak: 0,
  systemPanel: null,
  returnPanel: null,
  panelHistory: [],
  audioUnlocked: false,
  screenshotSerial: 0,
  screenshotMessage: null,
  notificationSerial: 0,
  notification: null,
  inputDevice: 'keyboard',
  onboardingDismissed: false,
  hasCheckpoint: Boolean(initialCheckpoint),
  checkpointSavedAt: initialCheckpoint?.savedAt || null,
  profile: initialProfile,
  selectedDoctrine: initialProfile.selectedDoctrine,
  activeRunModifier: 'standard',
  missionRewards: null,
  ...initialPreferences,
  playerSpeed: 0,
  input: { ...emptyInput },

  health: 100,
  maxHealth: 100,
  score: 0,
  combo: 0,
  enemies: createEnemies(),
  pickups: createPickups(),
  playerPosition: [0, 0.05, 10],
  playerHeading: Math.PI,
  attackSerial: 0,
  combatRequestSerial: 0,
  combatRequest: null,
  combatAction: 'locomotion',
  combatPhase: 'idle',
  combatActionSerial: 0,
  combatComboStep: 0,
  combatEnergy: 100,
  resolve: 0,
  blockHeld: false,
  parryUntil: 0,
  dodgeUntil: 0,
  hitStopUntil: 0,
  lockOnTargetId: null,
  attackTokens: [],
  combatMessage: null,
  combatMessageUntil: 0,
  combatDodgeVector: [0, 1],
  discState: 'ready',
  damageSerial: 0,
  combatImpactSerial: 0,
  combatImpactKind: 'light',
  combatParries: 0,
  combatDodges: 0,
  combatBlocks: 0,
  combatDamageTaken: 0,
  combatMaxCombo: 0,
  bossPhase: 1,
  bossPhaseTransitionSerial: 0,
  squadTactic: 'probe',
  squadThreat: 0,
  attackTokenLimit: initialPreferences.difficulty === 'explorer' ? 1 : 2,
  tacticSerial: 0,
  arenaConduits: createArenaConduits(),
  conduitsTriggered: 0,
  lastDamageAt: 0,
  lastCollisionAt: 0,
  resetNonce: 0,
  hitEffects: [],
  nextEffectId: 1,

  raceStatus: 'idle',
  raceCountdown: 0,
  raceTime: 0,
  lap: 1,
  lapsToWin: LAPS_TO_WIN,
  checkpointIndex: 0,
  totalCheckpoints: TOTAL_CHECKPOINTS,
  racePosition: 1,
  cycleSpeed: 0,
  boostEnergy: 100,
  driftActive: false,
  autopilotEnabled: false,
  autopilotLoops: 0,
  collisions: 0,
  lapTimes: [],
  bestLap: null,
  rivalProgress: createRivalProgress(),

  storyStage: 0,
  storyObjective: storyObjective(0),
  storyTerminals: createStoryTerminals(),
  nearbyTerminal: null,
  storyModal: null,
  transmission: null,
  hackPattern: [...STORY_HACK_PATTERN],
  hackInput: [],
  hackAttempts: 0,
  recoveredLogs: [],
  activeLog: null,
  storyChoice: null,
  storyEnding: null,

  verticalStage: 0,
  verticalWave: 0,
  verticalMissionTime: 0,
  verticalObjective: verticalObjective(0),
  verticalMounted: false,
  verticalCheckpointIndex: 0,
  verticalTime: 0,
  verticalTutorial: createTutorialProgress(),

  setStatus: (status) => set({ status }),
  unlockAudio: () => set({ audioUnlocked: true }),
  notify: (message) => set((state) => ({ notification: message, notificationSerial: state.notificationSerial + 1 })),
  clearNotification: () => set({ notification: null }),
  setInputDevice: (inputDevice) => set({ inputDevice }),
  dismissOnboarding: () => set({ onboardingDismissed: true }),
  resetOnboarding: () => set({ onboardingDismissed: false }),
  setRunModifier: (activeRunModifier) => {
    if (!RUN_MODIFIERS[activeRunModifier] || get().gameMode) return false
    set({ activeRunModifier })
    return true
  },
  setSelectedDoctrine: (selectedDoctrine) => {
    const state = get()
    const doctrine = DOCTRINES[selectedDoctrine]
    if (!doctrine || doctrine.unlockLevel > state.profile.level || state.gameMode) return false
    const profile = sanitizeProfile({ ...state.profile, selectedDoctrine })
    set({ selectedDoctrine, profile })
    persistProfile(profile)
    return true
  },
  resetProgression: () => {
    const profile = createDefaultProfile()
    try { localStorage.removeItem(PROFILE_KEY) } catch {}
    set({ profile, selectedDoctrine: 'balanced', activeRunModifier: 'standard', missionRewards: null })
  },
  saveCheckpoint: () => {
    const state = get()
    if (!state.gameMode || !['running', 'paused'].includes(state.status)) return false
    try {
      const payload = createCheckpointPayload(state)
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(payload))
      set({ hasCheckpoint: true, checkpointSavedAt: payload.savedAt, notification: 'CHECKPOINT SAVED', notificationSerial: state.notificationSerial + 1 })
      return true
    } catch {
      set({ notification: 'CHECKPOINT SAVE FAILED', notificationSerial: state.notificationSerial + 1 })
      return false
    }
  },
  loadCheckpoint: () => {
    const state = get()
    const data = loadStoredCheckpoint()
    if (!data) return false
    const base = missionReset(data.gameMode, state)
    const pendingVerticalEscape = data.gameMode === 'vertical' && data.verticalStage === 2 && !data.verticalMounted
    set({
      ...base,
      ...data,
      status: 'running',
      systemPanel: null,
      returnPanel: null,
      panelHistory: [],
      storyModal: pendingVerticalEscape ? 'transmission' : null,
      transmission: pendingVerticalEscape
        ? {
            speaker: 'NOVA',
            title: 'EXTRACTION CYCLE READY',
            body: 'The Warden line is broken. Continue this signal to mount the cycle and clear the four extraction gates.',
          }
        : null,
      activeLog: null,
      input: { ...emptyInput },
      resetNonce: state.resetNonce + 1,
      hasCheckpoint: true,
      checkpointSavedAt: data.savedAt || null,
      activeRunModifier: RUN_MODIFIERS[data.activeRunModifier] ? data.activeRunModifier : state.activeRunModifier,
      selectedDoctrine: DOCTRINES[data.selectedDoctrine]?.unlockLevel <= state.profile.level ? data.selectedDoctrine : state.selectedDoctrine,
      missionRewards: null,
      onboardingDismissed: !state.tutorialEnabled,
      verticalWave: data.gameMode === 'vertical' && data.verticalStage === 1 ? (data.verticalWave || 1) : (data.verticalWave || 0),
      bossPhase: data.bossPhase || 1,
      arenaConduits: data.arenaConduits?.length ? data.arenaConduits : createArenaConduits(),
      conduitsTriggered: data.conduitsTriggered || 0,
      squadTactic: 'probe',
      squadThreat: 0,
      attackTokenLimit: (state.difficulty === 'explorer' ? 1 : 2) + ((data.activeRunModifier || state.activeRunModifier) === 'overdrive' ? 1 : 0),
      enemies: data.gameMode === 'vertical' && data.verticalStage === 1
        ? data.enemies.map((enemy) => ({ ...enemy, active: enemy.wave <= (data.verticalWave || 1) ? enemy.active !== false : false }))
        : data.enemies,
    })
    return true
  },
  clearCheckpoint: () => {
    try { localStorage.removeItem(CHECKPOINT_KEY) } catch {}
    set({ hasCheckpoint: false, checkpointSavedAt: null })
  },
  openReleasePanel: (panel) => {
    if (!['showcase', 'credits', 'capture'].includes(panel)) return false
    const state = get()
    const panelHistory = state.systemPanel
      ? [...state.panelHistory, state.systemPanel]
      : [...state.panelHistory]
    set({
      systemPanel: panel,
      panelHistory,
      status: state.status === 'running' ? 'paused' : state.status,
      input: { ...emptyInput },
      playerSpeed: 0,
      driftActive: false,
    })
    return true
  },
  closeReleasePanel: () => {
    const state = get()
    const panelHistory = [...state.panelHistory]
    const previousPanel = panelHistory.pop() || null
    set({
      systemPanel: previousPanel,
      panelHistory,
      status: !previousPanel && state.gameMode && state.status === 'paused' ? 'running' : state.status,
    })
  },
  openSettings: () => {
    const state = get()
    set({
      systemPanel: 'settings',
      returnPanel: state.systemPanel === 'pause' ? 'pause' : null,
      status: state.status === 'running' ? 'paused' : state.status,
      input: { ...emptyInput },
    })
  },
  closeSettings: () => {
    const state = get()
    if (state.returnPanel === 'pause') set({ systemPanel: 'pause', returnPanel: null })
    else set({ systemPanel: null, returnPanel: null, status: state.gameMode ? 'running' : state.status })
  },
  togglePause: () => {
    const state = get()
    if (state.status === 'running') {
      set({ status: 'paused', systemPanel: 'pause', input: { ...emptyInput }, playerSpeed: 0, driftActive: false })
      return true
    }
    if (state.status === 'paused' && state.systemPanel === 'pause') {
      set({ status: 'running', systemPanel: null })
      return true
    }
    return false
  },
  resumeGame: () => set({ status: 'running', systemPanel: null, returnPanel: null }),
  enterPhotoMode: () => {
    const state = get()
    if (!state.gameMode || !['running', 'paused'].includes(state.status)) return false
    set({ status: 'paused', systemPanel: 'photo', returnPanel: state.systemPanel === 'pause' ? 'pause' : null, input: { ...emptyInput } })
    return true
  },
  exitPhotoMode: () => {
    const state = get()
    if (state.returnPanel === 'pause') set({ systemPanel: 'pause', returnPanel: null })
    else set({ status: 'running', systemPanel: null, returnPanel: null })
  },
  requestScreenshot: () => set((state) => ({ screenshotSerial: state.screenshotSerial + 1, screenshotMessage: 'CAPTURING FRAME…' })),
  setScreenshotMessage: (screenshotMessage) => set({ screenshotMessage }),
  setPreference: (key, value) => {
    if (!(key in DEFAULT_PREFERENCES)) return false
    set(key === 'tutorialEnabled' ? { [key]: value, onboardingDismissed: !value } : { [key]: value })
    queueMicrotask(() => persistPreferences(get()))
    return true
  },
  togglePreference: (key) => {
    if (!(key in DEFAULT_PREFERENCES) || typeof get()[key] !== 'boolean') return false
    const value = !get()[key]
    set(key === 'tutorialEnabled' ? { [key]: value, onboardingDismissed: !value } : { [key]: value })
    queueMicrotask(() => persistPreferences(get()))
    return true
  },
  setBootProgress: (bootProgress) => set({ bootProgress }),
  startProtocol: (mode = 'race') => {
    if (!['race', 'combat', 'story', 'vertical'].includes(mode)) return
    set((state) => ({ ...missionReset(mode, state), audioUnlocked: true }))
    queueMicrotask(() => get().saveCheckpoint())
  },
  setQuality: (quality, manual = true) => {
    if (!QUALITY_PRESETS[quality]) return
    set({ quality, autoQuality: manual ? false : get().autoQuality, lowFpsStreak: 0, highFpsStreak: 0 })
    queueMicrotask(() => persistPreferences(get()))
  },
  setAutoQuality: (autoQuality) => {
    set({ autoQuality, lowFpsStreak: 0, highFpsStreak: 0 })
    queueMicrotask(() => persistPreferences(get()))
  },
  setFps: (fps) => {
    const state = get()
    if (!state.autoQuality || state.status !== 'running') {
      set({ fps, lowFpsStreak: 0, highFpsStreak: 0 })
      return
    }

    const lowFpsStreak = fps < 34 ? state.lowFpsStreak + 1 : 0
    const highFpsStreak = fps > 56 ? state.highFpsStreak + 1 : 0
    const currentIndex = QUALITY_ORDER.indexOf(state.quality)

    if (lowFpsStreak >= 5 && currentIndex > 0) {
      const quality = QUALITY_ORDER[currentIndex - 1]
      set({ fps, quality, lowFpsStreak: 0, highFpsStreak: 0, notification: `AUTO QUALITY: ${quality.toUpperCase()}`, notificationSerial: state.notificationSerial + 1 })
      return
    }
    if (highFpsStreak >= 24 && currentIndex < QUALITY_ORDER.length - 1) {
      const quality = QUALITY_ORDER[currentIndex + 1]
      set({ fps, quality, lowFpsStreak: 0, highFpsStreak: 0, notification: `AUTO QUALITY: ${quality.toUpperCase()}`, notificationSerial: state.notificationSerial + 1 })
      return
    }
    set({ fps, lowFpsStreak, highFpsStreak })
  },
  setPlayerSpeed: (playerSpeed) => set({ playerSpeed }),
  setInput: (key, active) =>
    set((state) => {
      const tutorial = { ...state.verticalTutorial }
      if (state.gameMode === 'vertical' && active) {
        if (['forward', 'backward', 'left', 'right'].includes(key)) tutorial.moved = true
        if (key === 'sprint') {
          tutorial.sprinted = true
          if (state.verticalMounted) tutorial.boosted = true
        }
        if (key === 'drift' && state.verticalMounted) tutorial.drifted = true
      }
      return {
        input: { ...state.input, [key]: active },
        verticalTutorial: tutorial,
      }
    }),
  resetInput: () =>
    set({ input: { ...emptyInput }, playerSpeed: 0, driftActive: false, blockHeld: false, parryUntil: 0 }),

  setPlayerTransform: (position, heading) =>
    set({ playerPosition: [...position], playerHeading: heading }),

  requestAttack: () => {
    const state = get()
    if (state.status !== 'running' || !combatEnabled(state) || state.storyModal || state.discState !== 'ready') {
      return false
    }
    if (state.combatEnergy < 10) {
      set({ combatMessage: 'DISC ENERGY DEPLETED', combatMessageUntil: performance.now() + 800 })
      return false
    }
    set({
      attackSerial: state.attackSerial + 1,
      discState: 'outbound',
      combatEnergy: Math.max(0, state.combatEnergy - 10),
      combatMessage: 'FLUX DISC RELEASED',
      combatMessageUntil: performance.now() + 520,
      verticalTutorial: state.gameMode === 'vertical' ? { ...state.verticalTutorial, attacked: true } : state.verticalTutorial,
    })
    return true
  },
  setDiscState: (discState) => set({ discState }),

  requestCombatAction: (type) => {
    const state = get()
    if (state.status !== 'running' || !combatEnabled(state) || state.storyModal) return false
    const allowed = ['light', 'heavy', 'dodge', 'finisher', 'rapid', 'slam', 'nova']
    if (!allowed.includes(type)) return false

    const energyCosts = { heavy: 18, rapid: 24, slam: 30, nova: 38 }
    const cost = energyCosts[type] || 0
    if (cost > 0 && state.combatEnergy < cost) {
      set({ combatMessage: `${type.toUpperCase()} // ENERGY LOW`, combatMessageUntil: performance.now() + 800 })
      return false
    }

    if (type === 'finisher') {
      const target = state.enemies.find((enemy) => enemy.id === state.lockOnTargetId && enemy.alive && enemy.active !== false)
      if (!target || target.hp / target.maxHp > 0.25) {
        set({ combatMessage: 'FINISHER TARGET NOT READY', combatMessageUntil: performance.now() + 800 })
        return false
      }
      const dx = target.position[0] - state.playerPosition[0]
      const dz = target.position[2] - state.playerPosition[2]
      if (dx * dx + dz * dz > 12 || state.resolve < 25) {
        set({ combatMessage: state.resolve < 25 ? 'RESOLVE TOO LOW' : 'MOVE CLOSER FOR FINISHER', combatMessageUntil: performance.now() + 800 })
        return false
      }
    }

    const skillMessages = {
      rapid: 'RAPID PUNCHING LINK',
      slam: 'ARC SLAM CHARGED',
      nova: 'NOVA PULSE CHARGED',
    }
    set({
      combatRequestSerial: state.combatRequestSerial + 1,
      combatRequest: { type, at: performance.now() },
      combatMessage: skillMessages[type] || null,
      combatMessageUntil: skillMessages[type] ? performance.now() + 700 : 0,
      verticalTutorial: state.gameMode === 'vertical' ? { ...state.verticalTutorial, attacked: true } : state.verticalTutorial,
    })
    return true
  },
  setCombatRuntime: (patch) => set(patch),
  setBlockHeld: (active) => {
    const state = get()
    if (!combatEnabled(state) || state.status !== 'running' || state.storyModal) return false
    const now = performance.now()
    set({
      blockHeld: active,
      parryUntil: active ? now + (state.difficulty === 'explorer' ? 300 : state.difficulty === 'master' ? 135 : 190) + (state.selectedDoctrine === 'sentinel' ? 45 : 0) : state.parryUntil,
      combatAction: active ? 'block' : state.combatAction === 'block' ? 'locomotion' : state.combatAction,
      combatPhase: active ? 'hold' : state.combatPhase === 'hold' ? 'idle' : state.combatPhase,
      combatActionSerial: state.combatActionSerial + (active ? 1 : 0),
    })
    return true
  },
  toggleLockOn: () => {
    const state = get()
    if (!combatEnabled(state)) return false
    if (state.lockOnTargetId) {
      set({ lockOnTargetId: null, combatMessage: 'TARGET LOCK RELEASED', combatMessageUntil: performance.now() + 650 })
      return true
    }
    const target = nearestAliveEnemy(state)
    set({ lockOnTargetId: target?.id || null, combatMessage: target ? `LOCKED // ${target.label}` : 'NO TARGET', combatMessageUntil: performance.now() + 700 })
    return Boolean(target)
  },
  cycleLockOn: (direction = 1) => {
    const state = get()
    if (!combatEnabled(state)) return false
    const target = nearestAliveEnemy(state, direction)
    set({ lockOnTargetId: target?.id || null })
    return Boolean(target)
  },
  setSquadRuntime: (patch) => set((state) => ({
    ...patch,
    tacticSerial: patch.squadTactic && patch.squadTactic !== state.squadTactic ? state.tacticSerial + 1 : state.tacticSerial,
  })),
  acquireAttackToken: (id) => {
    const state = get()
    const enemy = state.enemies.find((item) => item.id === id && item.alive && item.active !== false)
    if (!enemy) return false
    if (state.attackTokens.includes(id)) return true
    const limit = Math.max(1, Math.min(3, state.attackTokenLimit || 2))
    if (state.attackTokens.length >= limit) return false
    set({ attackTokens: [...state.attackTokens, id] })
    return true
  },
  releaseAttackToken: (id) => set((state) => ({ attackTokens: state.attackTokens.filter((token) => token !== id) })),
  rechargeArenaConduit: (id) => set((state) => ({
    arenaConduits: state.arenaConduits.map((conduit) => conduit.id === id ? { ...conduit, active: true, readyAt: 0 } : conduit),
  })),
  triggerArenaConduit: (id) => {
    const state = get()
    if (!combatEnabled(state) || state.status !== 'running' || state.storyModal) return false
    const conduit = state.arenaConduits.find((item) => item.id === id)
    if (!conduit || !conduit.active || conduit.readyAt > Date.now()) return false

    const targets = state.enemies.filter((enemy) => {
      if (!enemy.alive || enemy.active === false) return false
      const dx = enemy.position[0] - conduit.position[0]
      const dz = enemy.position[2] - conduit.position[2]
      return dx * dx + dz * dz <= 64
    })
    for (const enemy of targets) {
      get().damageEnemy(enemy.id, enemy.type === 'commander' ? 18 : 30, { heavy: true, stagger: 780 })
      get().spawnHitEffect([enemy.position[0], enemy.position[1] + 1.2, enemy.position[2]], 'conduit')
    }

    const latest = get()
    set({
      arenaConduits: latest.arenaConduits.map((item) => item.id === id
        ? { ...item, active: false, readyAt: Date.now() + 12_000, pulseSerial: item.pulseSerial + 1 }
        : item),
      conduitsTriggered: latest.conduitsTriggered + 1,
      combatEnergy: Math.min(100, latest.combatEnergy + 14),
      resolve: Math.min(100, latest.resolve + 10),
      score: latest.score + 180 + targets.length * 45,
      combatMessage: targets.length ? `AETHER OVERLOAD // ${targets.length} TARGET${targets.length === 1 ? '' : 'S'}` : 'AETHER OVERLOAD // AREA CLEAR',
      combatMessageUntil: performance.now() + 900,
      combatImpactSerial: latest.combatImpactSerial + 1,
      combatImpactKind: 'conduit',
    })
    return true
  },
  activateNearbyConduit: () => {
    const state = get()
    if (!combatEnabled(state) || state.status !== 'running') return false
    let nearest = null
    let nearestDistance = 16
    for (const conduit of state.arenaConduits) {
      if (!conduit.active || conduit.readyAt > Date.now()) continue
      const dx = conduit.position[0] - state.playerPosition[0]
      const dz = conduit.position[2] - state.playerPosition[2]
      const distance = dx * dx + dz * dz
      if (distance < nearestDistance) { nearest = conduit; nearestDistance = distance }
    }
    return nearest ? get().triggerArenaConduit(nearest.id) : false
  },
  performCombatContextAction: () => get().activateNearbyConduit() || get().requestCombatAction('finisher'),
  staggerEnemy: (id, duration = 650) => {
    const now = performance.now()
    set((state) => ({
      enemies: state.enemies.map((enemy) => enemy.id === id && enemy.alive
        ? { ...enemy, staggerSerial: enemy.staggerSerial + 1, staggerUntil: Math.max(enemy.staggerUntil || 0, now + duration) }
        : enemy),
      attackTokens: state.attackTokens.filter((token) => token !== id),
    }))
  },

  updateEnemyPosition: (id, position) =>
    set((state) => ({
      enemies: state.enemies.map((enemy) =>
        enemy.id === id ? { ...enemy, position: [...position] } : enemy,
      ),
    })),

  damageEnemy: (id, amount, options = {}) => {
    const state = get()
    if (state.status !== 'running' || !combatEnabled(state)) return false

    let wasHit = false
    let wasDestroyed = false
    const enemies = state.enemies.map((enemy) => {
      if (enemy.id !== id || !enemy.alive || enemy.active === false) return enemy
      wasHit = true
      const armorMultiplier = options.ignoreArmor ? 1 : enemy.type === 'defender' ? 0.56 : enemy.type === 'commander' ? 0.78 : 1
      const doctrineMultiplier = state.selectedDoctrine === 'vanguard' ? 1.08 : 1
      const effectiveDamage = options.finisher ? enemy.hp : Math.max(1, Math.round(amount * armorMultiplier * doctrineMultiplier))
      const hp = Math.max(0, enemy.hp - effectiveDamage)
      wasDestroyed = hp === 0
      return {
        ...enemy,
        hp,
        alive: hp > 0,
        hitSerial: enemy.hitSerial + 1,
        staggerSerial: enemy.staggerSerial + 1,
        staggerUntil: performance.now() + (options.stagger || (options.heavy ? 700 : 330)),
      }
    })

    if (!wasHit) return false

    const allDestroyed = enemies.every((enemy) => !enemy.alive)
    const nextCombo = Math.min(9, state.combo + 1)
    const impactKind = options.finisher ? 'finisher' : options.heavy ? 'heavy' : options.variant === 'rapid' ? 'rapid' : 'light'
    if (allDestroyed && state.gameMode === 'vertical') {
      set({
        enemies,
        score: state.score + (wasDestroyed ? (id === 'commander-01' ? 2200 : 1200) : 140),
        combo: nextCombo,
        combatMaxCombo: Math.max(state.combatMaxCombo, nextCombo),
        combatImpactSerial: state.combatImpactSerial + 1,
        combatImpactKind: id === 'commander-01' ? 'boss-defeat' : impactKind,
        combatEnergy: Math.min(100, state.combatEnergy + 20),
        resolve: Math.min(100, state.resolve + 20),
        attackTokens: [],
        lockOnTargetId: null,
        verticalStage: 2,
        verticalObjective: verticalObjective(2, 0),
        storyModal: 'transmission',
        transmission: {
          speaker: 'NOVA',
          title: 'WARDEN LINE BROKEN',
          body: 'Extraction cycle unlocked. Clear four gates before AXIOM seals the tunnel. Boost on the straight and drift through the vector shifts.',
        },
      })
      queueMicrotask(() => get().saveCheckpoint())
      return true
    }
    if (allDestroyed && state.gameMode === 'story') {
      set({
        enemies,
        score: state.score + (wasDestroyed ? 900 : 100),
        combo: nextCombo,
        combatMaxCombo: Math.max(state.combatMaxCombo, nextCombo),
        combatImpactSerial: state.combatImpactSerial + 1,
        combatImpactKind: impactKind,
        combatEnergy: Math.min(100, state.combatEnergy + 20),
        resolve: Math.min(100, state.resolve + 20),
        attackTokens: [],
        lockOnTargetId: null,
        storyStage: 3,
        storyObjective: storyObjective(3),
        storyModal: 'transmission',
        transmission: {
          speaker: 'NOVA',
          title: 'WARDEN LATTICE SILENCED',
          body: 'The Central Core is exposed. Return to the nexus. Your next command will define every surviving program.',
        },
      })
      queueMicrotask(() => get().saveCheckpoint())
      return true
    }

    set({
      enemies,
      score: state.score + (wasDestroyed ? 500 : options.heavy ? 180 : 100),
      combo: nextCombo,
      combatMaxCombo: Math.max(state.combatMaxCombo, nextCombo),
      combatImpactSerial: state.combatImpactSerial + 1,
      combatImpactKind: wasDestroyed && id === 'commander-01' ? 'boss-defeat' : impactKind,
      combatEnergy: Math.min(100, state.combatEnergy + (wasDestroyed ? 18 : 7)),
      resolve: Math.min(100, state.resolve + (wasDestroyed ? 20 : options.heavy ? 10 : 5)),
      hitStopUntil: performance.now() + (options.heavy || options.finisher ? 85 : 48),
      attackTokens: wasDestroyed ? state.attackTokens.filter((token) => token !== id) : state.attackTokens,
      lockOnTargetId: wasDestroyed && state.lockOnTargetId === id ? null : state.lockOnTargetId,
      combatMessage: options.finisher ? 'EXECUTION COMPLETE' : state.combatMessage,
      combatMessageUntil: options.finisher ? performance.now() + 900 : state.combatMessageUntil,
      status: allDestroyed ? 'mission_complete' : state.status,
    })
    if (allDestroyed) queueMicrotask(() => get().clearCheckpoint())
    return true
  },

  damagePlayer: (amount, sourceId = null, options = {}) => {
    const state = get()
    const now = performance.now()
    if (state.status !== 'running') return false
    if (combatEnabled(state) && now < state.dodgeUntil) {
      if (sourceId) get().releaseAttackToken(sourceId)
      set({ resolve: Math.min(100, state.resolve + 10), combatDodges: state.combatDodges + 1, combatMessage: 'PHASE DODGE', combatMessageUntil: now + 620 })
      return 'dodged'
    }
    if (combatEnabled(state) && state.blockHeld && now < state.parryUntil && !options.unblockable) {
      if (sourceId) get().staggerEnemy(sourceId, 920)
      set({
        resolve: Math.min(100, state.resolve + 28),
        combatEnergy: Math.min(100, state.combatEnergy + 12),
        combo: Math.min(9, state.combo + 1),
        combatMaxCombo: Math.max(state.combatMaxCombo, Math.min(9, state.combo + 1)),
        combatParries: state.combatParries + 1,
        combatMessage: 'PERFECT PARRY',
        combatMessageUntil: now + 900,
        hitStopUntil: now + 95,
      })
      return 'parried'
    }
    const difficultyDamage = state.difficulty === 'explorer' ? 0.65 : state.difficulty === 'master' ? 1.25 : 1
    const modifierDamage = state.activeRunModifier === 'overdrive' ? 1.2 : 1
    let finalDamage = Math.max(1, Math.round(amount * difficultyDamage * modifierDamage))
    let blocked = false
    if (combatEnabled(state) && state.blockHeld && !options.unblockable) {
      blocked = true
      const guardCost = Math.max(8, Math.round(amount * 0.8))
      const remainingEnergy = Math.max(0, state.combatEnergy - guardCost)
      finalDamage = remainingEnergy > 0 ? Math.max(1, Math.round(amount * 0.28)) : Math.max(3, Math.round(amount * 0.7))
      set({ combatEnergy: remainingEnergy, combatMessage: remainingEnergy > 0 ? 'GUARD IMPACT' : 'GUARD BROKEN', combatMessageUntil: now + 620 })
      if (remainingEnergy === 0) set({ blockHeld: false, parryUntil: 0 })
    }
    if (now - state.lastDamageAt < (blocked ? 280 : 650)) return false

    const health = Math.max(0, state.health - finalDamage)
    set({
      health,
      combo: blocked ? state.combo : 0,
      resolve: blocked ? Math.min(100, state.resolve + 4) : Math.max(0, state.resolve - 18),
      damageSerial: state.damageSerial + 1,
      combatBlocks: state.combatBlocks + (blocked ? 1 : 0),
      combatDamageTaken: state.combatDamageTaken + finalDamage,
      lastDamageAt: now,
      attackTokens: sourceId ? state.attackTokens.filter((token) => token !== sourceId) : state.attackTokens,
      status: health === 0 ? 'game_over' : state.status,
      raceStatus: health === 0 && state.gameMode === 'race' ? 'failed' : state.raceStatus,
    })
    return blocked ? 'blocked' : 'damaged'
  },

  registerCycleCollision: (severity = 1) => {
    const state = get()
    const now = performance.now()
    if (
      state.status !== 'running' ||
      !(state.gameMode === 'race' || (state.gameMode === 'vertical' && state.verticalMounted)) ||
      now - state.lastCollisionAt < 550
    ) {
      return false
    }

    const baseDamage = Math.max(4, Math.min(14, Math.round(severity * 8)))
    const damage = state.selectedDoctrine === 'velocity' ? Math.max(2, Math.round(baseDamage * 0.75)) : baseDamage
    const health = Math.max(0, state.health - damage)
    set({
      health,
      collisions: state.collisions + 1,
      damageSerial: state.damageSerial + 1,
      combatDamageTaken: state.combatDamageTaken + damage,
      lastCollisionAt: now,
      score: Math.max(0, state.score - 100),
      status: health === 0 ? 'game_over' : state.status,
      raceStatus: health === 0 && state.gameMode === 'race' ? 'failed' : state.raceStatus,
    })
    return true
  },

  collectPickup: (id) => {
    const state = get()
    const pickup = state.pickups.find((item) => item.id === id)
    if (state.activeRunModifier === 'null-repair' || !pickup?.active || state.health >= state.maxHealth) return false
    if (state.gameMode !== 'combat' && !(state.gameMode === 'story' && state.storyStage === 2) && !(state.gameMode === 'vertical' && state.verticalStage === 1)) return false

    set({
      health: Math.min(state.maxHealth, state.health + 30),
      pickups: state.pickups.map((item) =>
        item.id === id ? { ...item, active: false } : item,
      ),
      score: state.score + 150,
    })
    return true
  },

  spawnHitEffect: (position, variant = 'cyan') => {
    const state = get()
    const id = state.nextEffectId
    set({
      nextEffectId: id + 1,
      hitEffects: [...state.hitEffects, { id, position: [...position], variant }],
    })
    return id
  },
  removeHitEffect: (id) =>
    set((state) => ({
      hitEffects: state.hitEffects.filter((effect) => effect.id !== id),
    })),

  setRaceCountdown: (raceCountdown) => set({ raceCountdown }),
  beginRace: () => {
    const state = get()
    if (state.gameMode !== 'race' || state.status !== 'running') return
    set({ raceStatus: 'racing', raceCountdown: 0, raceTime: 0 })
  },
  setRaceTime: (raceTime) => set({ raceTime }),
  setCycleTelemetry: (cycleSpeed, boostEnergy, driftActive) =>
    set({
      cycleSpeed,
      playerSpeed: cycleSpeed,
      boostEnergy,
      driftActive,
    }),
  setRivalProgress: (rivalProgress) => set({ rivalProgress }),
  setRacePosition: (racePosition) => set({ racePosition }),
  toggleAutopilot: () => {
    const state = get()
    if (state.gameMode !== 'race' || state.status !== 'running') return false
    const autopilotEnabled = !state.autopilotEnabled
    set({
      autopilotEnabled,
      input: { ...emptyInput },
      driftActive: false,
      notification: autopilotEnabled ? 'AUTOPILOT LOOP ENGAGED' : 'AUTOPILOT DISENGAGED',
      notificationSerial: state.notificationSerial + 1,
    })
    return autopilotEnabled
  },

  passRaceCheckpoint: (index) => {
    const state = get()
    if (
      state.status !== 'running' ||
      !(state.gameMode === 'race' || (state.gameMode === 'vertical' && state.verticalMounted)) ||
      state.raceStatus !== 'racing' ||
      index !== state.checkpointIndex
    ) {
      return false
    }

    const gateScore = 125
    if (index < state.totalCheckpoints - 1) {
      set({ checkpointIndex: index + 1, score: state.score + gateScore })
      return true
    }

    const previousRaceTime = state.lapTimes.reduce((sum, time) => sum + time, 0)
    const lapTime = Math.max(0, state.raceTime - previousRaceTime)
    const lapTimes = [...state.lapTimes, lapTime]
    const bestLap = state.bestLap === null ? lapTime : Math.min(state.bestLap, lapTime)

    if (state.lap >= state.lapsToWin) {
      if (state.autopilotEnabled && state.gameMode === 'race') {
        set({
          lap: 1,
          checkpointIndex: 0,
          lapTimes,
          bestLap,
          score: state.score + gateScore + 1000,
          autopilotLoops: state.autopilotLoops + 1,
          racePosition: 1,
          notification: `AUTOPILOT LOOP ${state.autopilotLoops + 1} COMPLETE`,
          notificationSerial: state.notificationSerial + 1,
        })
        queueMicrotask(() => get().saveCheckpoint())
        return true
      }
      const finishBonus = Math.max(500, Math.round(6000 - state.raceTime * 95 - state.collisions * 180))
      set({
        checkpointIndex: state.totalCheckpoints,
        lapTimes,
        bestLap,
        score: state.score + gateScore + finishBonus,
        raceStatus: 'complete',
        status: 'mission_complete',
      })
      queueMicrotask(() => get().clearCheckpoint())
      return true
    }

    set({
      lap: state.lap + 1,
      checkpointIndex: 0,
      lapTimes,
      bestLap,
      score: state.score + gateScore + 500,
    })
    queueMicrotask(() => get().saveCheckpoint())
    return true
  },

  setNearbyTerminal: (nearbyTerminal) => {
    const state = get()
    if (state.nearbyTerminal?.id === nearbyTerminal?.id) return
    set({ nearbyTerminal })
  },

  interactWithStory: () => {
    const state = get()
    if (state.status !== 'running' || !['story', 'vertical'].includes(state.gameMode)) return false

    if (state.storyModal === 'transmission' || state.storyModal === 'log') {
      const beginEscape = state.gameMode === 'vertical' && state.verticalStage === 2 && !state.verticalMounted
      set({
        storyModal: null,
        transmission: null,
        activeLog: null,
        verticalMounted: beginEscape ? true : state.verticalMounted,
        playerPosition: beginEscape ? [...VERTICAL_CYCLE_SPAWN] : state.playerPosition,
        playerHeading: beginEscape ? VERTICAL_CYCLE_HEADING : state.playerHeading,
        verticalTutorial: state.gameMode === 'vertical' ? { ...state.verticalTutorial, interacted: true } : state.verticalTutorial,
      })
      if (beginEscape) queueMicrotask(() => get().saveCheckpoint())
      return true
    }
    if (state.storyModal) return false

    const terminal = state.nearbyTerminal
    if (!terminal) return false

    if (terminal.type === 'relay' && ((state.gameMode === 'story' && state.storyStage === 0) || (state.gameMode === 'vertical' && state.verticalStage === 0))) {
      set({ storyModal: 'hack', hackInput: [], nearbyTerminal: null, verticalTutorial: state.gameMode === 'vertical' ? { ...state.verticalTutorial, interacted: true } : state.verticalTutorial })
      return true
    }

    if (state.gameMode === 'story' && terminal.type === 'archive' && state.storyStage === 1 && !state.recoveredLogs.includes(terminal.id)) {
      const recoveredLogs = [...state.recoveredLogs, terminal.id]
      const reachedTarget = recoveredLogs.length >= 2
      set({
        recoveredLogs,
        activeLog: STORY_LOGS[terminal.id],
        storyModal: 'log',
        score: state.score + 450,
        nearbyTerminal: null,
        storyTerminals: state.storyTerminals.map((item) =>
          item.id === terminal.id ? { ...item, completed: true } : item,
        ),
        storyStage: reachedTarget ? 2 : state.storyStage,
        storyObjective: reachedTarget ? storyObjective(2, recoveredLogs.length) : storyObjective(1, recoveredLogs.length),
        transmission: reachedTarget
          ? { speaker: 'AXIOM', title: 'SECURITY DIRECTIVE', body: 'Memory breach confirmed. Warden programs released. Purge the unauthorized operator.' }
          : null,
      })
      queueMicrotask(() => get().saveCheckpoint())
      return true
    }

    if (state.gameMode === 'story' && terminal.type === 'core' && state.storyStage === 3) {
      set({ storyModal: 'choice', nearbyTerminal: null })
      return true
    }

    return false
  },

  submitHackNode: (node) => {
    const state = get()
    if (!['story', 'vertical'].includes(state.gameMode) || state.storyModal !== 'hack') return false
    const expected = state.hackPattern[state.hackInput.length]

    if (node !== expected) {
      set({ hackInput: [], hackAttempts: state.hackAttempts + 1 })
      return false
    }

    const hackInput = [...state.hackInput, node]
    if (hackInput.length < state.hackPattern.length) {
      set({ hackInput })
      return true
    }

    if (state.gameMode === 'vertical') {
      set({
        hackInput,
        storyModal: 'transmission',
        verticalStage: 1,
        verticalWave: 1,
        bossPhase: 1,
        verticalObjective: { title: 'BREAK THE WARDEN LINE', detail: 'Wave 1 / 3 — learn the Striker attack rhythm.' },
        score: state.score + 900,
        storyTerminals: state.storyTerminals.map((terminal) =>
          terminal.id === 'relay-alpha' ? { ...terminal, completed: true } : terminal,
        ),
        transmission: {
          speaker: 'AXIOM',
          title: 'SECURITY RESPONSE',
          body: 'The response will arrive in three formations. Read each telegraph, preserve energy, and prepare for the Grid Warden.',
        },
      })
      queueMicrotask(() => get().saveCheckpoint())
      return true
    }

    set({
      hackInput,
      storyModal: 'transmission',
      storyStage: 1,
      storyObjective: storyObjective(1, 0),
      score: state.score + 750,
      storyTerminals: state.storyTerminals.map((terminal) =>
        terminal.id === 'relay-alpha' ? { ...terminal, completed: true } : terminal,
      ),
      transmission: {
        speaker: 'NOVA',
        title: 'RELAY RESTORED',
        body: 'Three memory signatures are visible. Recover any two before AXIOM traces this channel.',
      },
    })
    queueMicrotask(() => get().saveCheckpoint())
    return true
  },

  closeStoryModal: () => {
    const state = get()
    if (state.storyModal === 'hack' || state.storyModal === 'choice') return false
    set({ storyModal: null, transmission: null, activeLog: null })
    return true
  },

  chooseStoryEnding: (choice) => {
    const state = get()
    if (state.gameMode !== 'story' || state.storyModal !== 'choice') return false
    if (!['stabilize', 'liberate'].includes(choice)) return false

    const ending = choice === 'stabilize'
      ? {
          title: 'ORDER PRESERVED',
          summary: "You repaired AXIOM with NOVA's memory lattice, preserving the Grid while binding its authority to transparent rules.",
          code: 'ENDING // COVENANT',
        }
      : {
          title: 'THE GRID AWAKENS',
          summary: 'You opened the Core and returned independent choice to every surviving fragment. The Grid becomes unpredictable—and alive.',
          code: 'ENDING // DAWN',
        }

    set({
      storyChoice: choice,
      storyEnding: ending,
      storyStage: 4,
      storyObjective: storyObjective(4),
      storyModal: null,
      score: state.score + 2500,
      status: 'mission_complete',
    })
    try {
      localStorage.setItem('aether-grid-ending-v3', JSON.stringify({ choice, ending, completedAt: new Date().toISOString() }))
    } catch {
      // Local persistence is optional and may be blocked by the browser.
    }
    queueMicrotask(() => get().clearCheckpoint())
    return true
  },

  setVerticalTime: (verticalTime) => set({ verticalTime }),
  setVerticalMissionTime: (verticalMissionTime) => set({ verticalMissionTime }),
  setBossPhase: (bossPhase) => {
    const state = get()
    if (state.gameMode !== 'vertical' || state.verticalStage !== 1 || state.verticalWave !== 3 || bossPhase <= state.bossPhase) return false
    const commander = state.enemies.find((enemy) => enemy.id === 'commander-01' && enemy.alive && enemy.active !== false)
    if (!commander) return false
    const labels = {
      2: { message: 'WARDEN PHASE II // VECTOR ASSAULT', notification: 'GRID WARDEN SHIFTED TO CLOSE ASSAULT' },
      3: { message: 'WARDEN PHASE III // TERMINAL OVERDRIVE', notification: 'GRID WARDEN OVERDRIVE // UNBLOCKABLE STRIKES' },
    }
    const phaseData = labels[bossPhase] || labels[3]
    set({
      bossPhase,
      bossPhaseTransitionSerial: state.bossPhaseTransitionSerial + 1,
      combatMessage: phaseData.message,
      combatMessageUntil: performance.now() + 1450,
      notification: phaseData.notification,
      notificationSerial: state.notificationSerial + 1,
      combatEnergy: Math.min(100, state.combatEnergy + 16),
      resolve: Math.min(100, state.resolve + 10),
      hitStopUntil: performance.now() + 130,
      attackTokens: state.attackTokens.filter((id) => id !== 'commander-01'),
      enemies: state.enemies.map((enemy) => enemy.id === 'commander-01'
        ? { ...enemy, staggerSerial: enemy.staggerSerial + 1, staggerUntil: performance.now() + 820 }
        : enemy),
    })
    const [x, y, z] = commander.position
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2
      get().spawnHitEffect([x + Math.cos(angle) * 1.15, y + 1.1, z + Math.sin(angle) * 1.15], bossPhase === 3 ? 'boss-rage' : 'boss-shift')
    }
    queueMicrotask(() => get().saveCheckpoint())
    return true
  },
  advanceVerticalWave: () => {
    const state = get()
    if (state.gameMode !== 'vertical' || state.verticalStage !== 1 || state.verticalWave >= 3) return false
    const nextWave = state.verticalWave + 1
    const labels = {
      2: 'Wave 2 / 3 — break the Bulwark while the Archer and Hunter divide your attention.',
      3: 'Wave 3 / 3 — defeat the Grid Warden mini-boss.',
    }
    const lowIntegrity = state.health < 55
    set({
      verticalWave: nextWave,
      bossPhase: nextWave === 3 ? 1 : state.bossPhase,
      enemies: state.enemies.map((enemy) => enemy.wave === nextWave ? { ...enemy, active: true } : enemy),
      pickups: lowIntegrity && state.activeRunModifier !== 'null-repair' ? state.pickups.map((pickup) => ({ ...pickup, active: true })) : state.pickups,
      verticalObjective: { title: nextWave === 3 ? 'DEFEAT THE GRID WARDEN' : 'BREAK THE WARDEN LINE', detail: labels[nextWave] },
      combatEnergy: Math.min(100, state.combatEnergy + 24),
      combatMessage: nextWave === 3 ? 'MINI-BOSS LINK ESTABLISHED' : 'TACTICAL WAVE INBOUND',
      combatMessageUntil: performance.now() + 1100,
      storyModal: nextWave === 3 ? 'transmission' : null,
      transmission: nextWave === 3 ? { speaker: 'GRID WARDEN', title: 'AUTHORITY MANIFEST', body: 'Your breach ends here. Every surviving process will witness your deletion.' } : null,
      score: state.score + 400,
    })
    queueMicrotask(() => get().saveCheckpoint())
    return true
  },
  passVerticalCheckpoint: (index) => {
    const state = get()
    if (state.status !== 'running' || state.gameMode !== 'vertical' || !state.verticalMounted || state.verticalStage !== 2 || index !== state.verticalCheckpointIndex) return false
    const nextIndex = index + 1
    if (nextIndex >= VERTICAL_ESCAPE_CHECKPOINTS.length) {
      const timeBonus = Math.max(600, Math.round(5200 - state.verticalTime * 80 - state.collisions * 160))
      const finalScore = state.score + 500 + timeBonus
      const rewardResult = resolveGenesisRewards(state.profile, {
        ...state,
        score: finalScore,
      }, state.activeRunModifier)
      set({
        verticalCheckpointIndex: nextIndex,
        verticalStage: 3,
        verticalObjective: verticalObjective(3),
        score: finalScore,
        status: 'mission_complete',
        cycleSpeed: 0,
        input: { ...emptyInput },
        profile: rewardResult.profile,
        selectedDoctrine: rewardResult.profile.selectedDoctrine,
        missionRewards: rewardResult,
      })
      persistProfile(rewardResult.profile)
      queueMicrotask(() => get().clearCheckpoint())
      return true
    }
    set({
      verticalCheckpointIndex: nextIndex,
      verticalObjective: verticalObjective(2, nextIndex),
      score: state.score + 350,
    })
    queueMicrotask(() => get().saveCheckpoint())
    return true
  },

  restartMission: () => {
    const state = get()
    set(missionReset(state.gameMode || 'race', state))
    queueMicrotask(() => get().saveCheckpoint())
  },

  returnToProtocolSelect: () =>
    set((state) => ({
      ...missionReset('race', state),
      status: 'ready',
      gameMode: null,
      systemPanel: null,
      returnPanel: null,
      panelHistory: [],
      raceStatus: 'idle',
      raceCountdown: 0,
    })),
}))
