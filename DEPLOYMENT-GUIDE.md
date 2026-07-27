# Deployment Guide — Aether Grid Core Rebuild

1. Extract the lean player ZIP into a new GitHub repository root.
2. Install dependencies with `npm install`.
3. Run `npm run validate`.
4. Commit and push to the default branch.
5. Open **Settings → Pages** in GitHub.
6. Select **GitHub Actions** as the deployment source.
7. The included `.github/workflows/deploy.yml` workflow builds and publishes the Vite project.

## Production package

The player build excludes source FBX, Maya, Blender, USDZ, ZIP, and RAR files. The public runtime is approximately 19 MB before JavaScript dependency bundling.

## Before public release

- Verify every third-party asset license and attribution requirement.
- Replace any remaining strongly franchise-recognizable model silhouettes.
- Test Chrome, Edge, and Firefox.
- Test keyboard, gamepad, and touch fallback.
- Complete the five-person playtest checklist.
- Verify Continue and Restart Checkpoint after a fresh browser session.
- Confirm that Low quality remains playable on GT 1030-class hardware.
