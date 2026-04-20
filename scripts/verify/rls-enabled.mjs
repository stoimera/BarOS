/**
 * Verifies listed tables have ENABLE ROW LEVEL SECURITY in schemas/*.sql corpus.
 * Usage: node scripts/verify/rls-enabled.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.join(here, '..', '..')
const schemasDir = path.join(repo, 'schemas')
const registryPath = path.join(here, 'rls-registry.json')

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const required = registry.requireEnabledForTables || []

let corpus = ''
for (const name of fs.readdirSync(schemasDir)) {
  if (!name.endsWith('.sql')) continue
  corpus += fs.readFileSync(path.join(schemasDir, name), 'utf8') + '\n'
}
const lower = corpus.toLowerCase()

const missing = []
for (const table of required) {
  const re = new RegExp(
    `alter\\s+table\\s+(public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`,
    'i'
  )
  if (!re.test(corpus)) {
    missing.push(table)
  }
}

if (missing.length) {
  console.error('rls-enabled: missing ENABLE ROW LEVEL SECURITY for:', missing.join(', '))
  process.exit(1)
}
console.log('rls-enabled: ok (' + required.length + ' tables)')
