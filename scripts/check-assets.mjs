import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.resolve(root, 'public/assets/asset-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
let failures = 0

function inspectGlb(relativePath) {
  const absolutePath = path.resolve(root, 'public', relativePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing GLB: public/${relativePath}`)
    failures += 1
    return null
  }
  const buffer = fs.readFileSync(absolutePath)
  if (buffer.length < 20 || buffer.toString('utf8', 0, 4) !== 'glTF') {
    console.error(`Invalid GLB header: public/${relativePath}`)
    failures += 1
    return null
  }
  const version = buffer.readUInt32LE(4)
  const declaredLength = buffer.readUInt32LE(8)
  const jsonLength = buffer.readUInt32LE(12)
  const chunkType = buffer.toString('utf8', 16, 20)
  if (version !== 2 || declaredLength !== buffer.length || chunkType !== 'JSON') {
    console.error(`Invalid GLB structure: public/${relativePath}`)
    failures += 1
    return null
  }
  const jsonText = buffer.toString('utf8', 20, 20 + jsonLength).replace(/\u0000+$/g, '').trim()
  const document = JSON.parse(jsonText)
  const meshCount = document.meshes?.length || 0
  const sceneCount = document.scenes?.length || 0
  if (!meshCount || !sceneCount) {
    console.error(`GLB has no renderable scene/mesh: public/${relativePath}`)
    failures += 1
  }
  return { bytes: buffer.length, meshCount, sceneCount }
}

for (const asset of manifest.runtimeAssets) {
  if (asset.file.toLowerCase().endsWith('.glb')) {
    const details = inspectGlb(asset.file)
    if (details) console.log(`${asset.subject}: ${details.meshCount} mesh(es), ${(details.bytes / 1024 / 1024).toFixed(2)} MB`)
    continue
  }
  const absolutePath = path.resolve(root, 'public', asset.file)
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size < 64) {
    console.error(`Missing or invalid runtime asset: public/${asset.file}`)
    failures += 1
  } else {
    console.log(`${asset.subject}: ${(fs.statSync(absolutePath).size / 1024 / 1024).toFixed(2)} MB runtime source`)
  }
}

const sourceOnlyAssets = manifest.sourceOnlyAssets || []
for (const asset of sourceOnlyAssets) {
  const absolutePath = path.resolve(root, asset.file)
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing preserved source asset: ${asset.file}`)
    failures += 1
  }
}

if (failures) {
  console.error(`Asset check failed with ${failures} error(s).`)
  process.exit(1)
}

console.log(`Asset check passed: ${manifest.runtimeAssets.length} runtime models and ${sourceOnlyAssets.length} preserved source assets verified.`)
