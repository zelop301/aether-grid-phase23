import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const publicRoot = path.join(root, 'public')
const forbiddenExtensions = new Set(['.fbx', '.mb', '.ma', '.blend', '.usdz', '.zip', '.rar', '.7z'])
const forbiddenLabels = ['PHASE 19', 'VERTICAL SLICE // PLAYER EXPERIENCE']
let failures = 0
let bytes = 0

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(file)
    else {
      bytes += fs.statSync(file).size
      if (forbiddenExtensions.has(path.extname(entry.name).toLowerCase())) {
        failures += 1
        console.error(`Forbidden production asset: ${path.relative(root, file)}`)
      }
    }
  }
}
walk(publicRoot)

for (const relative of ['src/ui/BootScreen.jsx', 'src/ui/HUD.jsx', 'index.html']) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  for (const label of forbiddenLabels) {
    if (source.includes(label)) {
      failures += 1
      console.error(`Development label remains in ${relative}: ${label}`)
    }
  }
}

const sizeMb = bytes / 1024 / 1024
if (sizeMb > 55) {
  failures += 1
  console.error(`Public runtime is ${sizeMb.toFixed(1)} MB; budget is 55 MB.`)
}

if (failures) process.exit(1)
console.log(`Production check passed: ${sizeMb.toFixed(1)} MB public runtime, no source archives, no development phase labels.`)
