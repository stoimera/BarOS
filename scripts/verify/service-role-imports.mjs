/**
 * Only allowlisted modules may import @/utils/supabase/service-role directly.
 * Other code should use createUserSupabaseClient or the deprecated createClient from server.ts.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..')
const allowlistPath = join(__dirname, 'allowlists', 'service-role-imports.json')
const NEEDLE = '@/utils/supabase/service-role'

const { allowedFilePaths } = JSON.parse(readFileSync(allowlistPath, 'utf8'))
const allowed = new Set(allowedFilePaths.map((p) => p.replace(/\\/g, '/')))

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
for (const file of walk(join(repoRoot, 'src'))) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(NEEDLE)) continue
  const rel = relative(repoRoot, file).replace(/\\/g, '/')
  if (!allowed.has(rel)) {
    hits.push(rel)
  }
}

if (hits.length) {
  console.error(
    `service-role-imports: disallowed import of ${NEEDLE} in:\n  ${hits.join('\n  ')}\nAdd to scripts/verify/allowlists/service-role-imports.json only after intentional review.`
  )
  process.exit(1)
}
