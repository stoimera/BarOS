"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  className?: string
  resetKeys?: any[]
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: ErrorInfo
  resetError: () => void
  showDetails?: boolean
  className?: string
}

// Default error fallback component
export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  showDetails = false,
  className,
}: ErrorFallbackProps) {
  const errorId = React.useMemo(() => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const handleReportError = () => {
    // In a real app, you would send this to your error reporting service
    console.error('Error reported:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    })
    
    // You could also send to a service like Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: { errorInfo } })
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded bg-destructive/10">
            <span className="text-xl text-destructive">🐛</span>
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <p className="text-sm text-muted-foreground">
            We&apos;re sorry, but something unexpected happened. Please try again.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <span className="text-sm">⚠</span>
            <AlertDescription className="text-xs">
              {error.message}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full">
              <span className="mr-2">⟳</span>
              Try Again
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <span className="mr-2">‹</span>
                Go Back
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <span className="mr-2">🏠</span>
                Home
              </Button>
            </div>

            <Button variant="ghost" onClick={handleReportError} className="w-full">
              Report Error
            </Button>
          </div>

          {showDetails && errorInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error ID:</strong> {errorId}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main Error Boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
    
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKeys change
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo!, this.resetError)
        }
        return this.props.fallback
      }

      // Default fallback
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Error caught by useErrorHandler:', error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, resetError }
}

// Error boundary for specific components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Error display component for caught errors
export function ErrorDisplay({
  error,
  title = "An error occurred",
  description,
  onRetry,
  onDismiss,
  showDetails = false,
  className,
}: {
  error: Error
  title?: string
  description?: string
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  className?: string
}) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false)

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <h4 className="font-medium">{title}</h4>
            {description && <p className="text-sm">{description}</p>}
            <p className="text-sm">{error.message}</p>
          </div>
          
          <div className="flex gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <span className="mr-2">⟳</span>
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="outline" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
            {showDetails && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
              >
                {showErrorDetails ? 'Hide' : 'Show'} Details
              </Button>
            )}
          </div>

          {showDetails && showErrorDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
} 