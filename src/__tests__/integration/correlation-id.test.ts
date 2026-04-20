/**
 * @jest-environment node
 */
import { CORRELATION_ID_HEADER, resolveCorrelationIdFromRequest } from '@/lib/observability/correlation-id'
import { attachCorrelationIdHeader } from '@/lib/observability/correlation-response'
import { NextResponse } from 'next/server'

describe('correlation id (Track 9.1)', () => {
  it('reuses a valid incoming header', () => {
    const headers = new Headers()
    headers.set(CORRELATION_ID_HEADER, 'abc-123')
    const id = resolveCorrelationIdFromRequest({ headers })
    expect(id).toBe('abc-123')
  })

  it('generates a UUID when missing', () => {
    const id = resolveCorrelationIdFromRequest({ headers: new Headers() })
    expect(id).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('attaches header to responses', () => {
    const inner = NextResponse.json({ ok: true })
    const out = attachCorrelationIdHeader(inner, 'trace-1')
    expect(out.headers.get(CORRELATION_ID_HEADER)).toBe('trace-1')
  })
})
