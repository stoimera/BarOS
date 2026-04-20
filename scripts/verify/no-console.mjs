/**
 * Fail if console.* appears under configured roots (default: security + operations API).
 * Expand roots over time per roadmap Track 0.
 * Usage: node scripts/verify/no-console.mjs [extra-root ...]
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const DEFAULT_ROOTS = ['src/lib/security', 'src/app/api']
const roots = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROOTS

const CONSOLE_RE = /\bconsole\.(log|info|warn|error|debug)\s*\(/g

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) out.push(p)
  }
  return out
}

const hits = []
for (const r of roots) {
  const abs = join(process.cwd(), r)
  for (const file of walk(abs)) {
    const text = readFileSync(file, 'utf8')
    CONSOLE_RE.lastIndex = 0
    let m
    while ((m = CONSOLE_RE.exec(text)) !== null) {
      const line = text.slice(0, m.index).split('\n').length
      hits.push(`${relative(process.cwd(), file)}:${line}`)
    }
  }
}

if (hits.length) {
  console.error('no-console: forbidden console.* calls:\n' + [...new Set(hits)].join('\n'))
  process.exit(1)
}
console.log('no-console: ok')
