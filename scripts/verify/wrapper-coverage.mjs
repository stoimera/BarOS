/**
 * Ensures API route.ts files use withSecurity (same rules as scripts/security/route-coverage.mjs).
 * Usage: node scripts/verify/wrapper-coverage.mjs
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const script = path.join(here, '..', 'security', 'route-coverage.mjs')
const repoRoot = path.join(here, '..', '..')
const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd: repoRoot })
process.exit(r.status === null ? 1 : r.status)
