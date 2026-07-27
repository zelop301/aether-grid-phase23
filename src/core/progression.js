export const GENESIS_CHALLENGES = Object.freeze([
  { id: 'perfect-defense', label: 'PERFECT DEFENSE', detail: 'Perform at least 3 perfect parries.', reward: 100 },
  { id: 'conduit-control', label: 'CONDUIT CONTROL', detail: 'Overload at least 2 Aether Conduits.', reward: 100 },
  { id: 'clean-extraction', label: 'CLEAN EXTRACTION', detail: 'Finish with no more than 2 cycle impacts.', reward: 120 },
  { id: 'untouched-warden', label: 'WARDEN DISCIPLINE', detail: 'Take no more than 35 total damage.', reward: 150 },
  { id: 'speed-breach', label: 'SPEED BREACH', detail: 'Complete Genesis Breach within 180 seconds.', reward: 150 },
])

export const RUN_MODIFIERS = Object.freeze({
  standard: {
    id: 'standard',
    label: 'STANDARD LINK',
    detail: 'Default campaign balance and rewards.',
    rewardMultiplier: 1,
  },
  overdrive: {
    id: 'overdrive',
    label: 'HOSTILE OVERDRIVE',
    detail: 'Enemies gain one additional attack channel and deal 20% more damage.',
    rewardMultiplier: 1.25,
  },
  fragile: {
    id: 'fragile',
    label: 'FRAGILE LINK',
    detail: 'Maximum integrity is limited to 70%.',
    rewardMultiplier: 1.35,
  },
  'null-repair': {
    id: 'null-repair',
    label: 'NULL REPAIR',
    detail: 'Repair nodes are disabled for the entire mission.',
    rewardMultiplier: 1.2,
  },
})

export const DOCTRINES = Object.freeze({
  balanced: {
    id: 'balanced',
    label: 'BALANCED CORE',
    detail: 'Standard integrity, energy, parry timing, and vehicle recovery.',
    unlockLevel: 1,
  },
  vanguard: {
    id: 'vanguard',
    label: 'VANGUARD',
    detail: 'Begin with 20 Resolve and deal 8% more combat damage.',
    unlockLevel: 2,
  },
  sentinel: {
    id: 'sentinel',
    label: 'SENTINEL',
    detail: 'Gain 10 maximum integrity and a 45 ms wider parry window.',
    unlockLevel: 3,
  },
  velocity: {
    id: 'velocity',
    label: 'VELOCITY',
    detail: 'Gain 15 extra boost energy and take 25% less collision damage.',
    unlockLevel: 4,
  },
})

export function calculateGenesisRank(stats) {
  let value = 0
  if (stats.health >= 80) value += 2
  else if (stats.health >= 55) value += 1
  if (stats.collisions <= 1) value += 2
  else if (stats.collisions <= 3) value += 1
  if (stats.verticalMissionTime <= 150) value += 2
  else if (stats.verticalMissionTime <= 240) value += 1
  if (stats.score >= 9000) value += 2
  else if (stats.score >= 6500) value += 1
  if (stats.combatParries >= 3 || stats.combatMaxCombo >= 7) value += 1
  if (stats.combatDamageTaken <= 35) value += 1
  if (stats.conduitsTriggered >= 2) value += 1
  return value >= 9 ? 'S' : value >= 7 ? 'A' : value >= 4 ? 'B' : 'C'
}

export function evaluateGenesisChallenges(stats) {
  const completed = new Set()
  if (stats.combatParries >= 3) completed.add('perfect-defense')
  if (stats.conduitsTriggered >= 2) completed.add('conduit-control')
  if (stats.collisions <= 2) completed.add('clean-extraction')
  if (stats.combatDamageTaken <= 35) completed.add('untouched-warden')
  if (stats.verticalMissionTime <= 180) completed.add('speed-breach')
  return GENESIS_CHALLENGES.map((challenge) => ({ ...challenge, completed: completed.has(challenge.id) }))
}

const RANK_REWARD = Object.freeze({ S: 500, A: 350, B: 250, C: 150 })
const RANK_VALUE = Object.freeze({ '--': 0, C: 1, B: 2, A: 3, S: 4 })

export function levelFromXp(xp) {
  return Math.max(1, Math.min(20, Math.floor(Math.max(0, xp) / 500) + 1))
}

export function createDefaultProfile() {
  return {
    version: 1,
    coreFragments: 0,
    xp: 0,
    level: 1,
    runsCompleted: 0,
    bestRank: '--',
    bestScore: 0,
    bestTime: null,
    completedChallengeIds: [],
    selectedDoctrine: 'balanced',
  }
}

export function sanitizeProfile(data) {
  const fallback = createDefaultProfile()
  if (!data || typeof data !== 'object') return fallback
  const xp = Number.isFinite(data.xp) ? Math.max(0, Math.min(999_999, data.xp)) : 0
  const level = levelFromXp(xp)
  const selectedDoctrine = DOCTRINES[data.selectedDoctrine]?.unlockLevel <= level ? data.selectedDoctrine : 'balanced'
  return {
    version: 1,
    coreFragments: Number.isFinite(data.coreFragments) ? Math.max(0, Math.min(9_999_999, Math.floor(data.coreFragments))) : 0,
    xp,
    level,
    runsCompleted: Number.isFinite(data.runsCompleted) ? Math.max(0, Math.min(99_999, Math.floor(data.runsCompleted))) : 0,
    bestRank: Object.hasOwn(RANK_VALUE, data.bestRank) ? data.bestRank : '--',
    bestScore: Number.isFinite(data.bestScore) ? Math.max(0, Math.min(99_999_999, Math.floor(data.bestScore))) : 0,
    bestTime: Number.isFinite(data.bestTime) ? Math.max(0, Math.min(86_400, data.bestTime)) : null,
    completedChallengeIds: Array.isArray(data.completedChallengeIds)
      ? [...new Set(data.completedChallengeIds.filter((id) => GENESIS_CHALLENGES.some((challenge) => challenge.id === id)))]
      : [],
    selectedDoctrine,
  }
}

export function resolveGenesisRewards(profile, stats, modifierId = 'standard') {
  const safeProfile = sanitizeProfile(profile)
  const rank = calculateGenesisRank(stats)
  const challenges = evaluateGenesisChallenges(stats)
  const challengeReward = challenges.filter((challenge) => challenge.completed).reduce((total, challenge) => total + challenge.reward, 0)
  const modifier = RUN_MODIFIERS[modifierId] || RUN_MODIFIERS.standard
  const baseReward = RANK_REWARD[rank] || 0
  const fragmentsEarned = Math.round((baseReward + challengeReward) * modifier.rewardMultiplier)
  const xpEarned = Math.round((180 + baseReward * 0.45 + challengeReward * 0.25) * modifier.rewardMultiplier)
  const xp = safeProfile.xp + xpEarned
  const level = levelFromXp(xp)
  const completedChallengeIds = [...new Set([
    ...safeProfile.completedChallengeIds,
    ...challenges.filter((challenge) => challenge.completed).map((challenge) => challenge.id),
  ])]
  const nextProfile = sanitizeProfile({
    ...safeProfile,
    coreFragments: safeProfile.coreFragments + fragmentsEarned,
    xp,
    runsCompleted: safeProfile.runsCompleted + 1,
    bestRank: RANK_VALUE[rank] > RANK_VALUE[safeProfile.bestRank] ? rank : safeProfile.bestRank,
    bestScore: Math.max(safeProfile.bestScore, stats.score),
    bestTime: safeProfile.bestTime === null ? stats.verticalMissionTime : Math.min(safeProfile.bestTime, stats.verticalMissionTime),
    completedChallengeIds,
  })
  return {
    rank,
    challenges,
    baseReward,
    challengeReward,
    fragmentsEarned,
    xpEarned,
    modifierId: modifier.id,
    modifierLabel: modifier.label,
    rewardMultiplier: modifier.rewardMultiplier,
    previousLevel: safeProfile.level,
    newLevel: nextProfile.level,
    leveledUp: nextProfile.level > safeProfile.level,
    profile: nextProfile,
  }
}
