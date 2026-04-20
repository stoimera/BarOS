/**
 * Sentry Client Configuration (Instrumentation Client)
 *
 * This file configures Sentry for client-side error tracking.
 * Set NEXT_PUBLIC_SENTRY_DSN in your environment variables.
 *
 * This file is used by Next.js Turbopack for client-side instrumentation.
 *
 * NOTE: Sentry is disabled in development mode.
 */

import { resolveSentryEnvironment, scrubSentryEventForPII } from '@/lib/observability/sentry-pii'

// Skip Sentry initialization in development
if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      tracesSampleRate: 0.1,

      debug: false,

      environment: resolveSentryEnvironment(),

      release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,

      beforeSend(event) {
        scrubSentryEventForPII(event)
        return event
      },

      ignoreErrors: [
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'NetworkError',
        'Network request failed',
        'chrome-extension://',
        'moz-extension://',
      ],

      denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i],
    })

    /** Track 9.1 — forward browser errors with request context tags (no raw PII). */
    Sentry.setTag('runtime', 'browser')
  }).catch(() => {})
}

export const onRouterTransitionStart = (...args: [string, string]) => {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureRouterTransitionStart(args[0], args[1])
      })
      .catch(() => {})
  }
}
