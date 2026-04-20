import { NextResponse } from 'next/server'
import { CORRELATION_ID_HEADER } from '@/lib/observability/correlation-id'

/** Attaches `x-correlation-id` to any API response (Track 9.1). */
export function attachCorrelationIdHeader(response: Response, correlationId: string): Response {
  const headers = new Headers(response.headers)
  headers.set(CORRELATION_ID_HEADER, correlationId)
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
