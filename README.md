# Aether Grid: Legacy Protocol — Legacy Ascent

An original browser-based cyber-grid action game by Sammium Tech.

## Featured campaign

**Genesis Breach** connects onboarding, exploration, relay hacking, three paced combat formations, a three-phase Grid Warden boss encounter, and a Flux Cycle extraction in one continuous mission.

Optional modes remain available:

- Signal Fracture — branching story mission
- Warden Arena — combat challenge
- Velocity Trial — Flux Cycle race with rivals and autopilot

## Player-facing improvements

- Real critical-asset loading progress
- Automatic graphics recommendation
- Continue, checkpoints, mission restart, and safe recovery
- Keyboard, mouse, touch, and controller input
- Explorer, Standard, and Master difficulty
- Off, Light, and Full driving assistance
- Compact HUD, reduced flashing, reduced motion, high contrast, subtitles, and camera-impact options
- Optional performance benchmark
- Adaptive graphics and Photo Mode
- Three-wave campaign pacing and dedicated mini-boss health display
- Campaign timer with S/A/B/C mission ranking
- Three-phase Grid Warden behavior with escalating attack patterns
- Cyan, yellow, and red attack signals for parry, guard, and dodge decisions
- Combat mastery tracking for parries, dodges, blocks, damage taken, and maximum chain
- Stronger hit effects, procedural impact audio, and boss-aware camera framing
- Persistent operator levels, mastery XP, Core Fragments, best-run records, and challenge history
- Four unlockable operator doctrines and four selectable risk-reward modifiers
- Five repeatable Genesis Breach mission contracts
- Challenge Matrix loadout selection and expanded mission reward report

## Run

Extract the ZIP and double-click `START-PROJECT.bat`, or run:

```powershell
npm install
npm run dev
```

The local URL is normally `http://localhost:5173`.

## Validate

```powershell
npm run validate
```

## Core controls

### On foot

| Action | Keyboard / mouse | Controller |
|---|---|---|
| Move | WASD | Left stick |
| Sprint | Shift | L3 |
| Light attack | Left-click or J | X |
| Heavy attack | Right-click or K | Y |
| Block / parry | Q | LB |
| Dodge | Space | A |
| Vector Disc | F | RB |
| Lock target | Tab | R3 |
| Interact / finisher | E | B |

Advanced abilities remain available but are intentionally de-emphasized until the player learns the core combat loop.

### Flux Cycle

| Action | Keyboard | Controller |
|---|---|---|
| Accelerate / brake | W / S | RT / LT |
| Steer | A / D | Left stick |
| Boost | Shift | RB |
| Drift | Space | A |
| Autopilot | T | Y |

## Production structure

Runtime assets are centralized in `src/core/assetRegistry.js`. Source FBX, Maya, Blender, USDZ, ZIP, and RAR files are excluded from the lean player build.

```text
src/
├── core/          Asset registry, preload progress, identity, performance budget
├── game/          Player, combat, enemy, mission, vehicle, and environment systems
├── hooks/         Keyboard and gamepad input
├── store/         Central validated game state and checkpoints
├── ui/            Main menu, HUD, settings, onboarding, recovery, Photo Mode
└── audio/         Original procedural Web Audio system
```

## Important limitation

The current character uses a generated runtime auto-rig because the supplied hero model does not contain a production-ready authored skeleton. A final commercial-quality character should be rigged and weight-painted in Blender, then exported with authored animation clips in one optimized GLB.

## Phase 22 — Adaptive Front

Phase 22 adds adaptive enemy squad tactics and four interactive Aether Conduits. Enemy roles now coordinate pressure, suppression, encirclement, hunting, and boss assault patterns. Charged conduits can be overloaded with the contextual E/B/LINK action to damage and stagger nearby enemies while restoring Combat Energy and Resolve.

## Phase 23 — Legacy Ascent

Phase 23 adds a replayable progression layer around Genesis Breach. Players earn Core Fragments and mastery XP, improve best-run records, complete repeatable mission contracts, unlock operator doctrines, and choose optional campaign modifiers that trade additional risk for stronger progression rewards. All progression remains local to the browser and does not require an account.
