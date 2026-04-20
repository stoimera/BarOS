/** Canonical header for request correlation (Track 9.1). */
export const CORRELATION_ID_HEADER = 'x-correlation-id'

const MAX_LEN = 128

function isValidIncoming(value: string): boolean {
  const t = value.trim()
  if (!t || t.length > MAX_LEN) return false
  return /^[\w\-:.]+$/.test(t)
}

/**
 * Prefer the incoming correlation id or request id; otherwise generate a new UUID.
 * Safe for Edge (uses global crypto).
 */
export function resolveCorrelationIdFromRequest(req: { headers: Headers }): string {
  const incoming =
    req.headers.get(CORRELATION_ID_HEADER) ?? req.headers.get('x-request-id') ?? req.headers.get('X-Request-Id')
  if (incoming && isValidIncoming(incoming)) return incoming.trim()
  return crypto.randomUUID()
}
