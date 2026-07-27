export const TRACK_RADIUS = 31
export const TRACK_INNER_RADIUS = 26.5
export const TRACK_OUTER_RADIUS = 35.5
export const TRACK_HALF_WIDTH = (TRACK_OUTER_RADIUS - TRACK_INNER_RADIUS) / 2
export const TOTAL_CHECKPOINTS = 12
export const LAPS_TO_WIN = 2
export const START_ANGLE = Math.PI / 2

export const RACE_CHECKPOINTS = Array.from({ length: TOTAL_CHECKPOINTS }, (_, index) => {
  const angle = START_ANGLE - ((index + 1) / TOTAL_CHECKPOINTS) * Math.PI * 2
  return {
    id: `gate-${String(index + 1).padStart(2, '0')}`,
    index,
    angle,
    position: [Math.cos(angle) * TRACK_RADIUS, 0.08, Math.sin(angle) * TRACK_RADIUS],
    heading: Math.PI - angle,
  }
})

export const BOOST_PADS = [
  START_ANGLE - Math.PI * 0.48,
  START_ANGLE - Math.PI * 1.48,
].map((angle, index) => ({
  id: `boost-pad-${index + 1}`,
  angle,
  position: [Math.cos(angle) * TRACK_RADIUS, 0.055, Math.sin(angle) * TRACK_RADIUS],
  heading: Math.PI - angle,
}))

export const CYCLE_SPAWN = [0, 0.08, TRACK_RADIUS]
export const CYCLE_SPAWN_HEADING = Math.PI / 2

export const RIVAL_BLUEPRINTS = [
  {
    id: 'vector-9',
    label: 'VECTOR-9',
    color: '#ff9448',
    angularSpeed: 0.525,
    startOffset: -0.24,
    laneRadius: TRACK_RADIUS - 1.65,
  },
  {
    id: 'hex-runner',
    label: 'HEX RUNNER',
    color: '#9c6cff',
    angularSpeed: 0.505,
    startOffset: -0.46,
    laneRadius: TRACK_RADIUS + 1.65,
  },
]
