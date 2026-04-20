/**
 * Placeholder for Playwright route manifest (Track 9). Exits 0 until enforced.
 * Set ENFORCE_UI_ROUTE_REACHABILITY=1 and add e2e/manifests/dashboard-routes.json to enable.
 */
import fs from 'node:fs'
import path from 'node:path'

const manifest = path.join(process.cwd(), 'e2e', 'manifests', 'dashboard-routes.json')
if (process.env.ENFORCE_UI_ROUTE_REACHABILITY === '1') {
  if (!fs.existsSync(manifest)) {
    console.error('ui-route-reachable: ENFORCE set but manifest missing:', manifest)
    process.exit(1)
  }
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  } catch (e) {
    console.error('ui-route-reachable: invalid JSON', manifest, e)
    process.exit(1)
  }
  const routes = parsed?.routes
  if (!Array.isArray(routes) || routes.length === 0 || !routes.every((r) => typeof r === 'string' && r.startsWith('/'))) {
    console.error('ui-route-reachable: manifest must contain routes: string[] of paths starting with /')
    process.exit(1)
  }
  console.log('ui-route-reachable: manifest ok,', routes.length, 'routes (Playwright runner optional)')
  process.exit(0)
}
console.log('ui-route-reachable: skipped (set ENFORCE_UI_ROUTE_REACHABILITY=1 to require manifest)')
process.exit(0)
