"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Comprehensive skeleton components for consistent loading states
 * throughout the application
 */

// Stat Card Skeleton
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Table Skeleton with header
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: { 
  rows?: number
  columns?: number
  showHeader?: boolean 
}) {
  return (
    <div className="space-y-2">
      {showHeader && (
        <div className="flex items-center space-x-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-32" : colIndex === columns - 1 ? "w-20" : "w-24"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card Grid Skeleton
export function CardGridSkeleton({ 
  count = 6,
  columns = 3 
}: { 
  count?: number
  columns?: 1 | 2 | 3 | 4 
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={cn("grid gap-4 sm:gap-6", gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// List Item Skeleton
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

// Form Skeleton
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Dashboard Stats Skeleton (enhanced)
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Secondary Stats Skeleton (3 columns)
export function SecondaryStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Summary Card Skeleton
export function SummaryCardSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center p-3 bg-gray-50 rounded space-y-2">
              <Skeleton className="h-7 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Page Header Skeleton
export function PageHeaderSkeleton({ 
  showActions = true 
}: { 
  showActions?: boolean 
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {showActions && (
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  )
}

// Full Page Skeleton
export function PageSkeleton({ 
  showHeader = true,
  showStats = true,
  showContent = true 
}: { 
  showHeader?: boolean
  showStats?: boolean
  showContent?: boolean 
}) {
  return (
    <div className="space-y-6">
      {showHeader && <PageHeaderSkeleton />}
      {showStats && <DashboardStatsSkeleton />}
      {showContent && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <ListItemSkeleton count={3} />
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <ListItemSkeleton count={3} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Menu Item Skeleton
export function MenuItemSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center space-x-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}

// Booking Card Skeleton
export function BookingCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Inventory Item Skeleton
export function InventoryItemSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Event Card Skeleton
export function EventCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Customer Card Skeleton
export function CustomerCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Filter Bar Skeleton
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-gray-50">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

// Data Table Skeleton (with proper table structure)
export function DataTableSkeleton({ 
  rows = 5,
  columns = 5 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="divide-y">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-32" : "w-24"
                )} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

