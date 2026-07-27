export const RELEASE = {
  version: '3.4.0',
  phase: 'PHASE 23',
  codename: 'LEGACY ASCENT',
  title: 'AETHER GRID // LEGACY PROTOCOL',
  subtitle: 'An original cyber-grid action game built around one cohesive player journey',
  summary:
    'A browser-based WebGL action game featuring persistent operator progression, repeatable mission contracts, risk-reward modifiers, adaptive enemy tactics, interactive Aether Conduits, readable boss combat, controller support, assisted Flux Cycle handling, and adaptive graphics.',
  creator: 'Samuel C. Lopez',
  studio: 'Sammium Tech',
  stack: ['React', 'Three.js', 'React Three Fiber', 'Zustand', 'Vite', 'Web Audio API'],
  metrics: [
    { value: '1', label: 'UNIFIED CAMPAIGN' },
    { value: '3', label: 'OPTIONAL MODES' },
    { value: '5', label: 'ENEMY ROLES' },
    { value: '4', label: 'AETHER CONDUITS' },
    { value: '4', label: 'EXTRACTION GATES' },
    { value: '3', label: 'QUALITY PRESETS' },
    { value: '3', label: 'DIFFICULTY PRESETS' },
    { value: '3', label: 'DRIVING ASSIST LEVELS' },
    { value: '4', label: 'OPERATOR DOCTRINES' },
    { value: '5', label: 'MISSION CONTRACTS' },
  ],
}

export const PROTOCOLS = [
  {
    id: 'vertical',
    phase: 'CAMPAIGN',
    title: 'GENESIS BREACH',
    kicker: 'FEATURED MISSION',
    description: 'Infiltrate Relay Alpha, solve the signal lock, survive specialized Warden roles, then escape through a four-gate Flux Cycle route.',
    tags: ['PROGRESSION', 'MISSION CONTRACTS', 'CYCLE ESCAPE'],
  },
  {
    id: 'story',
    phase: 'STORY',
    title: 'SIGNAL FRACTURE',
    kicker: 'BRANCHING MISSION',
    description: 'Repair a relay, recover erased archives, survive a Warden response, and write one of two permanent endings.',
    tags: ['EXPLORATION', 'HACKING', 'BRANCHING STORY'],
  },
  {
    id: 'race',
    phase: 'RACE',
    title: 'VELOCITY TRIAL',
    kicker: 'FLUX CYCLE MODE',
    description: 'Pilot the Flux Cycle through a two-lap circuit with ordered gates, rival programs, boost management, drifting, assisted steering, and autopilot.',
    tags: ['FLUX CYCLE', 'RIVALS', 'AUTOPILOT'],
  },
  {
    id: 'combat',
    phase: 'ARENA',
    title: 'WARDEN ARENA',
    kicker: 'COMBAT CHALLENGE',
    description: 'Use keyboard, mouse, touch, or gamepad controls for combos, heavy strikes, parries, dodges, target lock, area attacks, and finishers.',
    tags: ['ADAPTIVE SQUADS', 'AETHER CONDUITS', 'ATTACK TOKENS'],
  },
]

export const CAPTURE_SHOTS = [
  { id: 'hero', number: '01', title: 'GENESIS BREACH', mode: 'vertical', instruction: 'Approach Relay Alpha and frame the Cipher Runner against the hallway and northern skyline.', filter: 'cyan' },
  { id: 'combat', number: '02', title: 'WARDEN COMBAT', mode: 'vertical', instruction: 'Reach the Warden encounter, group several roles in view, and capture a readable attack telegraph.', filter: 'amber' },
  { id: 'escape', number: '03', title: 'FLUX CYCLE ESCAPE', mode: 'vertical', instruction: 'Activate boost before a gate, pause in Photo Mode, and frame the energy trail at a low angle.', filter: 'cyan' },
  { id: 'core', number: '04', title: 'AETHER CORE', mode: 'story', instruction: 'Reach the final story stage and use Noir for a dramatic decision frame.', filter: 'noir' },
]

export const PORTFOLIO_COPY = `AETHER GRID: LEGACY PROTOCOL is an original browser-based 3D action game built with React, Three.js, React Three Fiber, Zustand, Vite, and the Web Audio API. The featured Genesis Breach campaign connects contextual onboarding, exploration, terminal hacking, returning-disc combat against differentiated enemy roles, and a timed Flux Cycle extraction in one continuous sequence. Phase 23 adds persistent operator mastery, unlockable doctrines, repeatable mission contracts, best-run records, and optional risk-reward modifiers. The project also includes adaptive graphics, accessibility settings, controller support, local checkpoints, assisted driving, Photo Mode, and optional story, arena, and racing modes. Selected user-supplied 3D models are credited separately and require license verification before public release.`

export const CREDITS = [
  ['CREATIVE DIRECTION', 'Samuel C. Lopez'],
  ['GAME DESIGN', 'Samuel C. Lopez'],
  ['ENGINEERING', 'Samuel C. Lopez'],
  ['CAMPAIGN DESIGN', 'Sammium Tech'],
  ['3D ASSET INTEGRATION', 'Sammium Tech'],
  ['USER-SUPPLIED MODELS', 'See ASSET-CREDITS.md'],
  ['UI / UX SYSTEMS', 'Sammium Tech'],
  ['STORY & WORLD', 'Sammium Tech'],
  ['AUDIO SYNTHESIS', 'Web Audio API procedural engine'],
  ['TECHNOLOGY', 'React, Three.js, React Three Fiber, Zustand, Vite'],
]
