/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for Edge runtime (middleware, edge functions).
 * Set NEXT_PUBLIC_SENTRY_DSN in your environment variables.
 */

import * as Sentry from '@sentry/nextjs'
import { resolveSentryEnvironment, scrubSentryEventForPII } from '@/lib/observability/sentry-pii'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: process.env.NODE_ENV === 'development',

  environment: resolveSentryEnvironment(),

  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,

  beforeSend(event, hint) {
    scrubSentryEventForPII(event)

    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
      return null
    }

    return event
  },
})
