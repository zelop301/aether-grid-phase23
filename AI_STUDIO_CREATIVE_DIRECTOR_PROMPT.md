# Aether Grid Creative Director Specification

## Mission
Transform the current Phase 23 implementation into a cohesive, polished, player-first 15–25 minute vertical slice. Improve quality before expanding scope.

## Priorities
1. Stability and progression blockers
2. Player movement, camera, grounding, collision, and lock-on
3. Proper authored character animation and blending
4. Combat timing, hitboxes, feedback, telegraphs, and enemy coordination
5. Genesis Breach level flow and encounter pacing
6. Flux Cycle handling and recovery
7. HUD, onboarding, accessibility, and controller usability
8. Performance on GT 1030-class hardware
9. Replay loop, contracts, and progression

## Product rules
- Preserve the existing project and modify it incrementally.
- Do not generate a new starter app.
- Do not add more abilities or modes until core movement, animation, combat feel, and campaign flow meet acceptance criteria.
- Keep the game original: Aether Grid, Cipher Runner, Vector Disc, Flux Cycle, Warden Programs, Grid Warden, Aether Conduits, Genesis Vault, NOVA, and AXIOM.
- Remove player-facing development-phase terminology.
- Prefer one polished campaign over many unfinished modes.
- Use data-driven combat definitions.
- Never claim skeletal retargeting unless the source and target skeletons were verified.
- Treat the runtime auto-rig as a fallback, not the final animation solution.
- Preserve accessibility: reduced motion, reduced flashing, high contrast, difficulty, driving assist, controller, keyboard, and touch.
- Do not expose secrets or add a Gemini API dependency unless explicitly required.

## Acceptance targets
- No progression blockers in Genesis Breach.
- Clear first five minutes without verbal coaching.
- Stable 50–60 FPS target on Medium for GT 1030-class hardware.
- Player always understands objective, danger, available action, and failure recovery.
- All combat attacks have startup, active, recovery, telegraph, audio, VFX, and cancel rules.
- Public build contains no source FBX, BLEND, RAR, USDZ, or source ZIP archives.
- Keyboard, gamepad, and reduced-motion paths are tested.
