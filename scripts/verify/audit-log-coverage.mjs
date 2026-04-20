/**
 * Routes that export mutating HTTP handlers must declare auditAction (withSecurity).
 * Usage: node scripts/verify/audit-log-coverage.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const apiRoot = path.join(process.cwd(), 'src', 'app', 'api')

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name === 'route.ts') acc.push(p)
  }
  return acc
}

const mutating = /export\s+const\s+(POST|PUT|PATCH|DELETE)\b/
const offenders = []

const auditExempt = (rel) => /src\/app\/api\/integrations\//.test(rel.replace(/\\/g, '/'))

for (const file of walk(apiRoot)) {
  const rel = path.relative(process.cwd(), file).split(path.sep).join('/')
  if (auditExempt(rel)) continue
  const c = fs.readFileSync(file, 'utf8')
  if (!mutating.test(c)) continue
  if (!c.includes('auditAction')) {
    offenders.push(rel)
  }
}

if (offenders.length) {
  console.error('audit-log-coverage: mutating routes missing auditAction:\n' + offenders.join('\n'))
  process.exit(1)
}
console.log('audit-log-coverage: ok')
