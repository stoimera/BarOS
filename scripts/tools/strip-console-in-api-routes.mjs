/**
 * One-off / repeatable: add createLogger + replace console.* in src/app/api route files.
 * Run: node scripts/tools/strip-console-in-api-routes.mjs
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

function routeTag(relPosix) {
  return (
    'api.' +
    relPosix
      .replace(/^src\/app\/api\//, '')
      .replace(/\/route\.ts$/, '')
      .replace(/\//g, '.')
  )
}

for (const file of walk(apiRoot)) {
  let c = fs.readFileSync(file, 'utf8')
  if (!/\bconsole\.(log|error|warn|debug|info)\s*\(/.test(c)) continue

  const relPosix = path.relative(process.cwd(), file).split(path.sep).join('/')
  const tag = routeTag(relPosix)

  if (!c.includes("from '@/lib/logger'") && !c.includes('from "@/lib/logger"')) {
    c = `import { createLogger } from '@/lib/logger'\n` + c
  }

  if (!c.includes(`createLogger('${tag}')`)) {
    const lines = c.split('\n')
    let i = 0
    while (i < lines.length && /^\s*import\s/.test(lines[i])) i++
    lines.splice(i, 0, '', `const log = createLogger('${tag}')`, '')
    c = lines.join('\n')
  }

  c = c.replace(/\bconsole\.error\s*\(/g, 'log.error(')
  c = c.replace(/\bconsole\.warn\s*\(/g, 'log.warn(')
  c = c.replace(/\bconsole\.log\s*\(/g, 'log.info(')
  c = c.replace(/\bconsole\.debug\s*\(/g, 'log.info(')
  c = c.replace(/\bconsole\.info\s*\(/g, 'log.info(')

  fs.writeFileSync(file, c)
  console.log('updated', relPosix)
}
