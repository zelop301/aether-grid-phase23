let context = null
let masterGain = null
let musicGain = null
let sfxGain = null
let ambientNodes = null
let activeScene = 'menu'

const sceneProfiles = {
  menu: { base: 48, upper: 96, level: 0.11 },
  story: { base: 42, upper: 126, level: 0.15 },
  vertical: { base: 52, upper: 156, level: 0.18 },
  combat: { base: 55, upper: 165, level: 0.17 },
  race: { base: 66, upper: 198, level: 0.2 },
  paused: { base: 38, upper: 76, level: 0.07 },
  complete: { base: 72, upper: 216, level: 0.12 },
}

function canUseAudio() {
  return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext)
}

function createContext() {
  if (!canUseAudio()) return null
  if (context) return context
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  context = new AudioContextClass()
  masterGain = context.createGain()
  musicGain = context.createGain()
  sfxGain = context.createGain()
  musicGain.connect(masterGain)
  sfxGain.connect(masterGain)
  masterGain.connect(context.destination)
  masterGain.gain.value = 0.8
  musicGain.gain.value = 0.4
  sfxGain.gain.value = 0.75
  return context
}

function createAmbientBed() {
  if (!context || ambientNodes) return
  const base = context.createOscillator()
  const upper = context.createOscillator()
  const shimmer = context.createOscillator()
  const lowpass = context.createBiquadFilter()
  const bedGain = context.createGain()
  const lfo = context.createOscillator()
  const lfoGain = context.createGain()
  base.type = 'sine'
  upper.type = 'triangle'
  shimmer.type = 'sine'
  lfo.type = 'sine'
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 520
  lowpass.Q.value = 1.8
  bedGain.gain.value = 0.0001
  lfo.frequency.value = 0.12
  lfoGain.gain.value = 0.035
  base.connect(lowpass)
  upper.connect(lowpass)
  shimmer.connect(lowpass)
  lowpass.connect(bedGain)
  bedGain.connect(musicGain)
  lfo.connect(lfoGain)
  lfoGain.connect(bedGain.gain)
  base.start()
  upper.start()
  shimmer.start()
  lfo.start()
  ambientNodes = { base, upper, shimmer, lowpass, bedGain, lfo, lfoGain }
  applyScene(activeScene, true)
}

function applyScene(scene, immediate = false) {
  if (!context || !ambientNodes) return
  const profile = sceneProfiles[scene] || sceneProfiles.menu
  const now = context.currentTime
  const ramp = immediate ? 0.01 : 0.85
  for (const [param, value] of [
    [ambientNodes.base.frequency, profile.base],
    [ambientNodes.upper.frequency, profile.upper],
    [ambientNodes.shimmer.frequency, profile.upper * 2.01],
    [ambientNodes.bedGain.gain, profile.level],
  ]) {
    param.cancelScheduledValues(now)
    param.setTargetAtTime(value, now, ramp)
  }
}

export async function unlockAudio() {
  const audioContext = createContext()
  if (!audioContext) return false
  try {
    if (audioContext.state === 'suspended') await audioContext.resume()
    createAmbientBed()
    return true
  } catch {
    return false
  }
}

export function updateAudioSettings({ masterVolume, musicVolume, sfxVolume, muted }) {
  if (!context) return
  const now = context.currentTime
  masterGain.gain.setTargetAtTime(muted ? 0 : masterVolume, now, 0.04)
  musicGain.gain.setTargetAtTime(musicVolume, now, 0.04)
  sfxGain.gain.setTargetAtTime(sfxVolume, now, 0.04)
}

export function setMusicScene(scene) {
  activeScene = scene
  applyScene(scene)
}

function tone({ frequency = 440, endFrequency = frequency, duration = 0.12, type = 'sine', volume = 0.13, delay = 0 }) {
  if (!context || !sfxGain || context.state !== 'running') return
  const now = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration)
  filter.type = 'lowpass'
  filter.frequency.value = 2600
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(sfxGain)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.04)
}

export function playUi(kind = 'hover') {
  const presets = {
    hover: { frequency: 520, endFrequency: 690, duration: 0.055, type: 'sine', volume: 0.045 },
    confirm: { frequency: 330, endFrequency: 880, duration: 0.14, type: 'triangle', volume: 0.08 },
    cancel: { frequency: 440, endFrequency: 160, duration: 0.12, type: 'triangle', volume: 0.07 },
    error: { frequency: 130, endFrequency: 82, duration: 0.22, type: 'sawtooth', volume: 0.08 },
  }
  tone(presets[kind] || presets.hover)
}

export function playGameSound(kind) {
  if (kind === 'disc') {
    tone({ frequency: 190, endFrequency: 980, duration: 0.2, type: 'sawtooth', volume: 0.075 })
    tone({ frequency: 740, endFrequency: 420, duration: 0.25, type: 'sine', volume: 0.05, delay: 0.04 })
  } else if (kind === 'damage') {
    tone({ frequency: 115, endFrequency: 48, duration: 0.34, type: 'sawtooth', volume: 0.13 })
  } else if (kind === 'checkpoint') {
    tone({ frequency: 420, endFrequency: 840, duration: 0.13, type: 'triangle', volume: 0.09 })
    tone({ frequency: 630, endFrequency: 1120, duration: 0.12, type: 'sine', volume: 0.06, delay: 0.08 })
  } else if (kind === 'hack') {
    tone({ frequency: 260, endFrequency: 520, duration: 0.11, type: 'square', volume: 0.05 })
  } else if (kind === 'light') {
    tone({ frequency: 210, endFrequency: 120, duration: 0.075, type: 'square', volume: 0.055 })
    tone({ frequency: 880, endFrequency: 520, duration: 0.06, type: 'sine', volume: 0.035 })
  } else if (kind === 'rapid') {
    tone({ frequency: 300, endFrequency: 175, duration: 0.06, type: 'square', volume: 0.05 })
  } else if (kind === 'heavy' || kind === 'finisher' || kind === 'boss-defeat') {
    tone({ frequency: kind === 'boss-defeat' ? 92 : 145, endFrequency: 42, duration: kind === 'boss-defeat' ? 0.58 : 0.3, type: 'sawtooth', volume: kind === 'boss-defeat' ? 0.16 : 0.12 })
    tone({ frequency: 720, endFrequency: 210, duration: 0.22, type: 'triangle', volume: 0.07, delay: 0.025 })
  } else if (kind === 'parry') {
    tone({ frequency: 620, endFrequency: 1480, duration: 0.12, type: 'triangle', volume: 0.1 })
    tone({ frequency: 1220, endFrequency: 860, duration: 0.16, type: 'sine', volume: 0.055, delay: 0.035 })
  } else if (kind === 'dodge') {
    tone({ frequency: 510, endFrequency: 1040, duration: 0.1, type: 'sine', volume: 0.055 })
  } else if (kind === 'bossPhase') {
    tone({ frequency: 82, endFrequency: 44, duration: 0.55, type: 'sawtooth', volume: 0.14 })
    tone({ frequency: 330, endFrequency: 980, duration: 0.36, type: 'triangle', volume: 0.08, delay: 0.08 })
  } else if (kind === 'complete') {
    ;[0, 0.13, 0.26].forEach((delay, index) => {
      tone({ frequency: [330, 494, 659][index], endFrequency: [440, 659, 880][index], duration: 0.32, type: 'triangle', volume: 0.08, delay })
    })
  }
}
