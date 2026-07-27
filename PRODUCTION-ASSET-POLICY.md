# Production Asset Policy

The lean player build contains browser-ready runtime assets only.

Excluded from public deployment:

- FBX
- Maya MB/MA
- Blender BLEND
- USDZ
- ZIP/RAR/7Z archives
- Reference screenshots
- High-resolution source textures
- Duplicate models

Every runtime model must be represented in `src/core/assetRegistry.js` with a path, preload group, scale, collision role, and LOD class.

Before public or commercial distribution, verify ownership, redistribution permission, attribution, and modification rights for every supplied asset.
