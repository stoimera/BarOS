"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface SkeletonProps {
  className?: string
  count?: number
  height?: string
  width?: string
}

export interface LoadingCardProps {
  className?: string
  showHeader?: boolean
  showContent?: boolean
  lines?: number
}

export interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
  showHeader?: boolean
}

export interface LoadingListProps {
  items?: number
  className?: string
  itemHeight?: string
  showAvatar?: boolean
  showSubtitle?: boolean
}

// Basic skeleton components
export function SkeletonText({ className, count = 1, height = "h-4", width = "w-full" }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(height, width, className)}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ className, size = "h-10 w-10" }: { className?: string; size?: string }) {
  return <Skeleton className={cn("rounded-full", size, className)} />
}

export function SkeletonButton({ className, size = "h-9 w-20" }: { className?: string; size?: string }) {
  return <Skeleton className={cn("rounded-md", size, className)} />
}

export function SkeletonInput({ className, size = "h-10 w-full" }: { className?: string; size?: string }) {
  return <Skeleton className={cn("rounded-md", size, className)} />
}

// Card loading skeleton
export function LoadingCard({ 
  className, 
  showHeader = true, 
  showContent = true, 
  lines = 3 
}: LoadingCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      {showContent && (
        <CardContent className="space-y-3">
          <SkeletonText count={lines} />
        </CardContent>
      )}
    </Card>
  )
}

// Table loading skeleton
export function LoadingTable({ 
  rows = 5, 
  columns = 4, 
  className, 
  showHeader = true 
}: LoadingTableProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showHeader && (
        <div className="flex space-x-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// List loading skeleton
export function LoadingList({ 
  items = 5, 
  className, 
  itemHeight = "h-16", 
  showAvatar = true, 
  showSubtitle = true 
}: LoadingListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={cn("flex items-center space-x-3", itemHeight)}>
          {showAvatar && <SkeletonAvatar />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            {showSubtitle && <Skeleton className="h-3 w-1/2" />}
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid loading skeleton
export function LoadingGrid({ 
  items = 8, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  className 
}: { 
  items?: number
  columns?: { sm?: number; md?: number; lg?: number; xl?: number }
  className?: string 
}) {
  const gridClasses = cn(
    "grid gap-4",
    {
      [`grid-cols-${columns.sm || 1}`]: columns.sm,
      [`md:grid-cols-${columns.md || columns.sm || 1}`]: columns.md,
      [`lg:grid-cols-${columns.lg || columns.md || columns.sm || 1}`]: columns.lg,
      [`xl:grid-cols-${columns.xl || columns.lg || columns.md || columns.sm || 1}`]: columns.xl,
    },
    className
  )

  return (
    <div className={gridClasses}>
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} lines={2} />
      ))}
    </div>
  )
}

// Form loading skeleton
export function LoadingForm({ 
  fields = 4, 
  className 
}: { 
  fields?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <SkeletonInput />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <SkeletonButton size="h-9 w-20" />
        <SkeletonButton size="h-9 w-20" />
      </div>
    </div>
  )
}

// Dashboard loading skeleton
export function LoadingDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <LoadingList items={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <LoadingTable rows={5} columns={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Profile loading skeleton
export function LoadingProfile({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <SkeletonAvatar size="h-20 w-20" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <SkeletonButton size="h-9 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <LoadingForm fields={6} />
        </CardContent>
      </Card>
    </div>
  )
}

// Page loading skeleton
export function LoadingPage({ 
  showHeader = true, 
  showSidebar = false,
  className 
}: { 
  showHeader?: boolean
  showSidebar?: boolean
  className?: string 
}) {
  return (
    <div className={cn("min-h-screen", className)}>
      {showHeader && (
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-24" />
              <SkeletonAvatar />
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {showSidebar && (
          <div className="w-64 border-r p-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 p-6">
          <LoadingDashboard />
        </div>
      </div>
    </div>
  )
}

const SPINNER_SIZE_PRESET: Record<string, string> = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
}

// Inline loading spinner
export function LoadingSpinner({ 
  size = "h-4 w-4", 
  className 
}: { 
  size?: string
  className?: string 
}) {
  const dimension =
    typeof size === "string" && size in SPINNER_SIZE_PRESET
      ? SPINNER_SIZE_PRESET[size]
      : size
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        dimension,
        className
      )}
    />
  )
}

// Loading overlay
export function LoadingOverlay({ 
  children, 
  loading, 
  className 
}: { 
  children: React.ReactNode
  loading: boolean
  className?: string 
}) {
  if (!loading) return <>{children}</>

  return (
    <div className="relative">
      {children}
      <div className={cn(
        "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center space-y-2">
          <LoadingSpinner size="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  )
} 