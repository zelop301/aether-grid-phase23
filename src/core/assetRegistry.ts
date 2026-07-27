const MODEL_ROOT = `${import.meta.env.BASE_URL}assets/models/`

export type PreloadGroup = 'critical' | 'vehicle' | 'combat' | 'story' | 'race' | 'ambient' | 'optional'
export type CollisionRole = 'none' | 'capsule' | 'box' | 'mesh'
export type LodClass = 'hero' | 'character' | 'medium' | 'environment' | 'ambient' | 'background'

export interface AssetDefinition {
  path: string
  preload: PreloadGroup
  scale: number
  collision: CollisionRole
  lod: LodClass
}

export const ASSET_REGISTRY = {
  cipherRunner: { path: `${MODEL_ROOT}cipher-runner.glb`, preload: 'critical', scale: 0.00246, collision: 'capsule', lod: 'hero' },
  riderFallback: { path: `${MODEL_ROOT}rider-fallback.glb`, preload: 'vehicle', scale: 0.52, collision: 'none', lod: 'hero' },
  vectorArsenal: { path: `${MODEL_ROOT}vector-arsenal.glb`, preload: 'combat', scale: 1, collision: 'none', lod: 'hero' },
  coreRings: { path: `${MODEL_ROOT}aether-core-rings.glb`, preload: 'story', scale: 0.235, collision: 'none', lod: 'environment' },
  interceptor: { path: `${MODEL_ROOT}warden-interceptor.glb`, preload: 'ambient', scale: 0.56, collision: 'none', lod: 'ambient' },
  transitTunnel: { path: `${MODEL_ROOT}transit-tunnel.glb`, preload: 'vehicle', scale: 0.78, collision: 'mesh', lod: 'environment' },
  fluxCycle: { path: `${MODEL_ROOT}flux-cycle.glb`, preload: 'vehicle', scale: 1, collision: 'box', lod: 'hero' },
  rivalCycle: { path: `${MODEL_ROOT}rival-flux-cycle.glb`, preload: 'race', scale: 1, collision: 'box', lod: 'medium' },
  warden: { path: `${MODEL_ROOT}warden-runtime.glb`, preload: 'combat', scale: 1, collision: 'capsule', lod: 'character' },
  city: { path: `${MODEL_ROOT}aether-city.glb`, preload: 'ambient', scale: 1, collision: 'none', lod: 'background' },
  vectorJet: { path: `${MODEL_ROOT}vector-jet.glb`, preload: 'ambient', scale: 1, collision: 'none', lod: 'ambient' },
  civilianRunner: { path: `${MODEL_ROOT}civilian-runner.glb`, preload: 'ambient', scale: 0.82, collision: 'none', lod: 'ambient' },
  securityRunner: { path: `${MODEL_ROOT}security-runner.glb`, preload: 'story', scale: 0.82, collision: 'box', lod: 'medium' },
  genesisHallway: { path: `${MODEL_ROOT}genesis-hallway.glb`, preload: 'story', scale: 1, collision: 'mesh', lod: 'environment' },
} as const satisfies Record<string, AssetDefinition>

export const CRITICAL_ASSETS: readonly string[] = [
  ASSET_REGISTRY.cipherRunner.path,
  ASSET_REGISTRY.vectorArsenal.path,
  ASSET_REGISTRY.genesisHallway.path,
]

export const ASSETS_BY_MODE = {
  campaign: [
    ASSET_REGISTRY.cipherRunner.path,
    ASSET_REGISTRY.vectorArsenal.path,
    ASSET_REGISTRY.warden.path,
    ASSET_REGISTRY.genesisHallway.path,
    ASSET_REGISTRY.securityRunner.path,
    ASSET_REGISTRY.fluxCycle.path,
    ASSET_REGISTRY.riderFallback.path,
    ASSET_REGISTRY.transitTunnel.path,
  ],
  story: [
    ASSET_REGISTRY.cipherRunner.path,
    ASSET_REGISTRY.vectorArsenal.path,
    ASSET_REGISTRY.warden.path,
    ASSET_REGISTRY.coreRings.path,
    ASSET_REGISTRY.genesisHallway.path,
    ASSET_REGISTRY.securityRunner.path,
  ],
  combat: [ASSET_REGISTRY.cipherRunner.path, ASSET_REGISTRY.vectorArsenal.path, ASSET_REGISTRY.warden.path],
  race: [ASSET_REGISTRY.fluxCycle.path, ASSET_REGISTRY.rivalCycle.path, ASSET_REGISTRY.riderFallback.path, ASSET_REGISTRY.transitTunnel.path],
} as const satisfies Record<string, readonly string[]>
