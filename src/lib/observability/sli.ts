import { getActiveCorrelationId } from '@/lib/observability/correlation-store'

/**
 * Structured SLI hook for log pipelines / metrics adapters (Track 9.2).
 * Emits one JSON line per call; suppressed under Jest unless SLI_LOG_IN_TESTS=1.
 */
export function recordSliEvent(name: string, ok: boolean, latencyMs?: number): void {
  if (process.env.JEST_WORKER_ID && process.env.SLI_LOG_IN_TESTS !== '1') return

  const line = JSON.stringify({
    type: 'sli',
    name,
    ok,
    latencyMs: latencyMs ?? null,
    correlationId: getActiveCorrelationId() ?? null,
    time: new Date().toISOString(),
  })
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(`${line}\n`)
  }
}
