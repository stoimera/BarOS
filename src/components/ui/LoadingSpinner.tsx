'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const variantClasses = {
  default: 'text-muted-foreground',
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400'
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <span
        className={cn(
          'animate-spin inline-block',
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        ⟳
      </span>
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Skeleton loading component
interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        'animate-pulse rounded bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  ))

  return <>{skeletons}</>
}

// Loading overlay component
interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  text?: string
  className?: string
}

export function LoadingOverlay({
  loading,
  children,
  text = 'Loading...',
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  )
}

// Progress bar component
interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const progressVariantClasses = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
}

export function ProgressBar({
  progress,
  className,
  showPercentage = false,
  variant = 'default'
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">
          Progress
        </span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">
            {clampedProgress}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            progressVariantClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

// Loading states for different content types
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
} 