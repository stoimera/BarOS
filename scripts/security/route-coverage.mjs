import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..', '..')
const apiRoot = path.join(repoRoot, 'src', 'app', 'api')
const outputDir = path.join(repoRoot, 'security')
const outputPath = path.join(outputDir, 'security-coverage.json')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else if (entry.isFile() && entry.name === 'route.ts') {
      files.push(full)
    }
  }
  return files
}

function classify(content, relPath) {
  const hasWithSecurity = /withSecurity\s*(<[^>]+>)?\s*\(/.test(content)
  const hasRequireAdmin = content.includes('requireAdmin(')
  const hasAuthGetUser = content.includes('auth.getUser(')
  const methods = [
    ...new Set(
      [
        ...content.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|DELETE|PATCH)/g),
      ].map((m) => m[1])
    ),
  ].sort()

  let status = 'unsecured'
  if (hasWithSecurity) status = 'secured_wrapper'
  else if (hasRequireAdmin) status = 'secured_custom'
  else if (hasAuthGetUser) status = 'partial_auth'
  else if (relPath.includes('/api/integrations/')) status = 'secured_webhook_stub'

  return { status, methods }
}

const files = walk(apiRoot)
const routes = files.map((file) => {
  const content = fs.readFileSync(file, 'utf8')
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/')
  const { status, methods } = classify(content, rel)
  return { route: rel, status, methods }
})

const totals = routes.reduce((acc, route) => {
  acc[route.status] = (acc[route.status] || 0) + 1
  return acc
}, {})

const report = {
  generatedAt: new Date().toISOString(),
  totals,
  routes: routes.sort((a, b) => a.route.localeCompare(b.route)),
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
console.log(`Wrote ${outputPath}`)

const unsecured = totals.unsecured || 0
const partial = totals.partial_auth || 0
if (unsecured > 0 || partial > 0) {
  console.error(
    `Security coverage check failed: unsecured=${unsecured}, partial_auth=${partial} (webhook stubs excluded)`
  )
  process.exit(1)
}

console.log('Security coverage check passed.')
