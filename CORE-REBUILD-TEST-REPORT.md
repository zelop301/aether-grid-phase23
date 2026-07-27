# Core Rebuild Test Report

## Passed

- TypeScript core typecheck
- 59 JavaScript, JSX, and TypeScript source files parsed
- All relative imports resolved
- Campaign-first main-menu checks
- Real byte-based loading progress checks
- Original runtime asset naming checks
- Checkpoint v3 validation checks
- Production package check: approximately 19.1 MB under `public/`
- No FBX, Maya, Blender, USDZ, ZIP, RAR, or 7Z files in the player build
- 14 runtime GLB integrity checks
- Rider contact, lean, wheel, suspension, and camera checks
- Actual hero auto-rig checks
- Motorcycle stability checks
- Autopilot loop checks
- Combat, parry, dodge, finisher, lock-on, and attack-token checks
- Complete campaign, story, race, settings, Photo Mode, and state-machine smoke tests

## Not completed in this environment

The npm registry timed out during dependency installation, so the final Vite production build could not be executed here. Run `npm install` and `npm run validate` locally or use the included GitHub Actions workflow.
