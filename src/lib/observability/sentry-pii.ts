import type { Event } from '@sentry/nextjs'

/** Deployment slice for Sentry environments (Track 9.4). */
export function resolveSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    'development'
  )
}

const SENSITIVE_HEADER_NAMES = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-supabase-auth']

function scrubHeaders(headers: Record<string, string>): void {
  for (const name of SENSITIVE_HEADER_NAMES) {
    const key = Object.keys(headers).find((h) => h.toLowerCase() === name)
    if (key && headers[key]) headers[key] = '[Filtered]'
  }
}

function scrubQueryString(qs: string): string {
  const sensitiveParams = ['token', 'key', 'password', 'secret', 'code']
  try {
    const params = new URLSearchParams(qs)
    for (const p of sensitiveParams) {
      if (params.has(p)) params.set(p, '[Filtered]')
    }
    return params.toString()
  } catch {
    return ''
  }
}

/** In-place PII minimization before sending to Sentry (Track 9.4). */
export function scrubSentryEventForPII(event: Event): void {
  const e = event as Event & { user?: unknown }
  delete e.user

  const request = event.request
  if (!request) return

  if (request.cookies) {
    delete request.cookies
  }

  if (request.headers && typeof request.headers === 'object') {
    scrubHeaders(request.headers as Record<string, string>)
  }

  if (typeof request.query_string === 'string' && request.query_string.length > 0) {
    request.query_string = scrubQueryString(request.query_string)
  }

  if (request.data !== undefined && request.data !== null) {
    request.data = '[Omitted]'
  }

  const crumbs = event.breadcrumbs
  if (!Array.isArray(crumbs)) return
  for (const b of crumbs) {
    if (b?.data && typeof b.data === 'object' && !Array.isArray(b.data)) {
      const d = b.data as Record<string, unknown>
      for (const key of Object.keys(d)) {
        if (/email|phone|password|token|secret|cookie|authorization/i.test(key)) {
          d[key] = '[Filtered]'
        }
      }
    }
  }
}
