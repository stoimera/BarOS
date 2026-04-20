/**
 * Fail if TODO|FIXME|XXX appears in production source (excludes tests).
 * Usage: node scripts/verify/no-todos.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(process.cwd(), 'src')
const BAD = /TODO|FIXME|XXX/g
const SKIP_DIR = new Set(['__tests__', 'node_modules', '.next'])
const SKIP_FILE = (name) =>
  name.endsWith('.test.ts') ||
  name.endsWith('.test.tsx') ||
  name.endsWith('.spec.ts') ||
  name.endsWith('.spec.tsx')

/** @param {string} dir */
function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue
      walk(p, out)
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      if (SKIP_FILE(e.name)) continue
      out.push(p)
    }
  }
  return out
}

const hits = []
for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file)
  const text = readFileSync(file, 'utf8')
  let m
  const re = new RegExp(BAD.source, 'g')
  while ((m = re.exec(text)) !== null) {
    const line = text.slice(0, m.index).split('\n').length
    hits.push(`${rel}:${line}:${m[0]}`)
  }
}

if (hits.length) {
  console.error('no-todos: forbidden markers found:\n' + hits.join('\n'))
  process.exit(1)
}
console.log('no-todos: ok')
