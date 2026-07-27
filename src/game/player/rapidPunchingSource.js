let sourcePromise = null

function createProceduralSource() {
  let time = 0
  return {
    duration: 0.72,
    restart() { time = 0 },
    sample(delta) {
      time += delta
      const phase = (time % 0.72) / 0.72
      const wave = Math.sin(phase * Math.PI * 8)
      return {
        left: Math.max(0, -wave),
        right: Math.max(0, wave),
        twist: wave,
        phase,
      }
    },
  }
}

export function loadRapidPunchingSource() {
  if (!sourcePromise) sourcePromise = Promise.resolve(createProceduralSource())
  return sourcePromise
}
