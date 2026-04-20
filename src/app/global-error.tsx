/**
 * Global Error Handler for Next.js App Router
 * 
 * This file catches React rendering errors that escape error boundaries.
 * It's required for proper Sentry error tracking.
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send error to Sentry
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: {
            errorBoundary: 'global',
          },
        });
      }).catch(() => {
        // Sentry not available, ignore
      });
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-red-100 dark:bg-red-900">
                <span className="text-red-600 dark:text-red-400 text-lg">⚠</span>
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>Application Error</AlertTitle>
                <AlertDescription>
                  {error.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {error.digest && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Error ID: {error.digest}
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={reset} className="flex-1">
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}

