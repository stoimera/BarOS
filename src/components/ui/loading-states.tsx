import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

// Re-export all skeleton components from skeletons.tsx
export * from "@/components/ui/skeletons"

// Legacy exports for backward compatibility
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-8 w-[80px]" />
            </div>
            <Skeleton className="h-12 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Error component with retry functionality
export function ErrorAlert({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: { 
  title?: string
  message?: string
  onRetry?: () => void 
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      {message && <AlertDescription>{message}</AlertDescription>}
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2"
        >
          Try Again
        </Button>
      )}
    </Alert>
  )
}

// Empty state component
export function EmptyState({ 
  title, 
  description, 
  icon: Icon,
  action 
}: { 
  title: string
  description: string
  icon: any
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}

// Loading overlay for modals and forms
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3 shadow-xl">
        <LoadingSpinner size="md" />
        <span className="text-foreground">{message}</span>
      </div>
    </div>
  )
}

// Loading wrapper component
export function LoadingWrapper({ 
  loading, 
  children, 
  skeleton,
  error,
  onRetry 
}: { 
  loading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  error?: string | null
  onRetry?: () => void
}) {
  if (error) {
    return <ErrorAlert message={error} onRetry={onRetry} />
  }

  if (loading) {
    return skeleton || <LoadingSpinner fullScreen text="Loading..." />
  }

  return <>{children}</>
} 