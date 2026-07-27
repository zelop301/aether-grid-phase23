import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let ts

try {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')
} catch {
  console.log('TypeScript parser not found globally; parser check skipped.')
}

const srcRoot = path.resolve('src')
const files = []

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(fullPath)
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(fullPath)
  }
}

function resolveRelativeImport(file, specifier) {
  const base = path.resolve(path.dirname(file), specifier)
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  return candidates.some((candidate) => fs.existsSync(candidate))
}

collect(srcRoot)
let failures = 0

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')

  if (ts) {
    const result = ts.transpileModule(source, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        allowJs: true,
      },
    })

    const errors = (result.diagnostics || []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    )

    if (errors.length) {
      failures += errors.length
      console.error(`\n${file}`)
      for (const error of errors) {
        console.error(ts.flattenDiagnosticMessageText(error.messageText, '\n'))
      }
    }
  }

  const importPattern = /(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g
  for (const match of source.matchAll(importPattern)) {
    if (!resolveRelativeImport(file, match[1])) {
      failures += 1
      console.error(`\n${file}\nMissing relative import: ${match[1]}`)
    }
  }
}

if (failures) {
  console.error(`\nSource check failed with ${failures} error(s).`)
  process.exit(1)
}

console.log(`Source check passed: ${files.length} JavaScript/JSX files parsed and imports resolved.`)
