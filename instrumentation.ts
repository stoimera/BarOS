/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically called by Next.js when the server starts.
 * It initializes Sentry for server-side error tracking.
 */

import { assertProductionEnvAtBoot } from './src/lib/security/env'

export async function register() {
  assertProductionEnvAtBoot()

  // Skip Sentry in development
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string;
    headers: Record<string, string | string[] | undefined>;
    method?: string;
  },
  context: {
    routerKind?: string;
    routePath?: string;
  }
) {
  // Only import Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    try {
      const Sentry = await import('@sentry/nextjs')
      const hdrs = request.headers
      const correlationId =
        typeof hdrs === 'object' && hdrs !== null && !Array.isArray(hdrs)
          ? (hdrs['x-correlation-id'] as string | string[] | undefined)
          : undefined
      const cid = Array.isArray(correlationId) ? correlationId[0] : correlationId
      Sentry.captureException(err, {
        extra: {
          path: request.path,
          method: request.method || 'GET',
        },
        tags: {
          routerKind: context.routerKind,
          routePath: context.routePath,
          ...(cid ? { correlation_id: String(cid).slice(0, 128) } : {}),
        },
      })
    } catch {
      // Sentry not available, ignore
    }
  }
}

