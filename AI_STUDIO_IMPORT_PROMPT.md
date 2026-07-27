# Google AI Studio Import Prompt

Use this immediately after importing the repository into Google AI Studio Build mode.

```text
Treat the imported GitHub repository as the only source of truth.

This is an existing React + Vite + React Three Fiber game named "Aether Grid: Legacy Ascent". Do not create a replacement starter app, do not rename the source folders, and do not delete the public/assets/models GLB files.

First:
1. Inspect package.json, vite.config.js, src/, public/assets/asset-manifest.json, and AI_STUDIO_PROJECT_MANIFEST.json.
2. Preserve all current gameplay systems and file paths.
3. Run npm install, npm run typecheck, npm run check, and npm run build where the environment permits.
4. Report actual errors before changing code.
5. Fix only confirmed build/runtime blockers first.
6. Never claim a test passed unless it was executed successfully.
7. Never replace binary assets with invented placeholders unless an asset is genuinely missing.
8. Keep the app client-only unless a server feature is explicitly requested.
9. Do not add a Gemini API key; this game does not require Gemini API access.
10. After the initial audit, list: confirmed build status, blocking errors, risky files, and the next five highest-value improvements.

The design direction is contained in AI_STUDIO_CREATIVE_DIRECTOR_PROMPT.md. Use it as the product specification, but preserve the existing Phase 23 implementation and improve it incrementally.
```
