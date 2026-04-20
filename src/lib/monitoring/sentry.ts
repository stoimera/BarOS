/**
 * Sentry Monitoring Utilities
 * 
 * Helper functions for error tracking and monitoring with Sentry
 */

/**
 * Capture an exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
        extra: context,
      });
    }).catch(() => {
      // Sentry not available, ignore
    });
  }
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, level);
    }).catch(() => {
      // Sentry not available, ignore
    });
  }
}

/**
 * Set user context for Sentry
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    }).catch(() => {
      // Sentry not available, ignore
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser(null);
    }).catch(() => {
      // Sentry not available, ignore
    });
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error', data?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.addBreadcrumb({
        message,
        category: category || 'default',
        level: level || 'info',
        data,
      });
    }).catch(() => {
      // Sentry not available, ignore
    });
  }
}

