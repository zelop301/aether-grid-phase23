import { CRITICAL_ASSETS } from './assetRegistry.ts'

type ProgressCallback = (value: number) => void

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

async function fetchAsset(url: string, onChunk: ProgressCallback): Promise<void> {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error(`Unable to load ${url}`)
  const total = Number(response.headers.get('content-length')) || 0
  if (!response.body || !total) {
    await response.arrayBuffer()
    onChunk(1)
    return
  }
  const reader = response.body.getReader()
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    loaded += value.byteLength
    onChunk(Math.min(1, loaded / total))
  }
}

export async function preloadCoreAssets(onProgress: ProgressCallback = () => {}): Promise<void> {
  const progress = new Array<number>(CRITICAL_ASSETS.length).fill(0)
  const update = () => onProgress(progress.reduce((sum, value) => sum + value, 0) / progress.length)
  await Promise.all(CRITICAL_ASSETS.map((url, index) => fetchAsset(url, (value) => {
    progress[index] = value
    update()
  })))
  onProgress(1)
}

export type RecommendedQuality = 'low' | 'medium' | 'high'

export function recommendQuality(): RecommendedQuality {
  const nav = navigator as NavigatorWithMemory
  const memory = nav.deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4
  const pixels = window.innerWidth * window.innerHeight * (window.devicePixelRatio || 1)
  if (memory <= 4 || cores <= 4 || pixels > 5_000_000) return 'low'
  if (memory >= 8 && cores >= 8 && pixels < 4_000_000) return 'high'
  return 'medium'
}
