"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface CardGridProps<T> {
  data: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void
  emptyMessage?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  className?: string
  gridClassName?: string
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number
  title?: string
  description?: string
  actions?: React.ReactNode
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: React.ReactNode
  selectable?: boolean
  selectedItems?: T[]
  onSelectionChange?: (items: T[]) => void
  getItemKey?: (item: T, index: number) => string | number
  virtualized?: boolean
  virtualizedItemHeight?: number
  virtualizedOverscan?: number
}

export function CardGrid<T extends object>({
  data,
  renderCard,
  loading = false,
  error,
  onRetry,
  emptyMessage = "No items found",
  emptyIcon: EmptyIcon = AlertCircle,
  className,
  gridClassName,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  title,
  description,
  actions,
  pagination,
  search,
  filters,
  selectable = false,
  selectedItems = [],
  getItemKey = (_, index) => index,
}: CardGridProps<T>) {
  // Generate responsive grid classes
  const gridClasses = useMemo(() => {
    const cols = typeof columns === 'number' 
      ? { sm: columns, md: columns, lg: columns, xl: columns }
      : columns

    return cn(
      "grid gap-4",
      {
        [`grid-cols-${cols.sm || 1}`]: cols.sm,
        [`md:grid-cols-${cols.md || cols.sm || 1}`]: cols.md,
        [`lg:grid-cols-${cols.lg || cols.md || cols.sm || 1}`]: cols.lg,
        [`xl:grid-cols-${cols.xl || cols.lg || cols.md || cols.sm || 1}`]: cols.xl,
      },
      gridClassName
    )
  }, [columns, gridClassName])

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        {(title || description || actions) && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                {title && <h2 className="text-2xl font-bold">{title}</h2>}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
              {actions}
            </div>
          </div>
        )}

        <div className={gridClasses}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <span className="text-sm">⚠</span>
          <AlertDescription>
            {error}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2"
              >
                <span className="text-sm mr-2">⟳</span>
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {(title || description || actions || search || filters || selectable) && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <h2 className="text-2xl font-bold">{title}</h2>}
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {selectable && data.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {selectedItems.length} of {data.length} selected
                  </span>
                </div>
              )}
              {actions}
            </div>
          </div>

          {/* Search and Filters */}
          {(search || filters) && (
            <div className="flex items-center gap-4">
              {search && (
                <div className="flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder={search.placeholder || "Search..."}
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>
              )}
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <EmptyIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className={gridClasses}>
          {data.map((item, index) => (
            <div key={getItemKey(item, index)}>
              {renderCard(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={pagination.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-built card components
export interface InfoCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
  className?: string
}

export function InfoCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  onClick,
  className,
}: InfoCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export interface ActionCardProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost"
  }
  onClick?: () => void
  className?: string
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  action,
  onClick,
  className,
}: ActionCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      {action && (
        <CardContent>
          <Button
            variant={action.variant || "default"}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
            }}
          >
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  )
} 