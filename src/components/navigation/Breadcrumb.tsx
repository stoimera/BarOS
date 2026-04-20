"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeHref?: string
  className?: string
  itemClassName?: string
  separatorClassName?: string
  maxItems?: number
  showEllipsis?: boolean
}

export function Breadcrumb({
  items,
  separator = <span className="text-xs">›</span>,
  showHome = true,
  homeHref = "/",
  className,
  itemClassName,
  separatorClassName,
  maxItems,
  showEllipsis = true,
}: BreadcrumbProps) {
  const allItems = React.useMemo(() => {
    const homeItem: BreadcrumbItem = {
      label: "Home",
      href: homeHref,
    }
    
    return showHome ? [homeItem, ...items] : items
  }, [items, showHome, homeHref])

  const visibleItems = React.useMemo(() => {
    if (!maxItems || allItems.length <= maxItems) {
      return allItems
    }

    const start = 1
    const end = allItems.length - 1

    const startItems = allItems.slice(0, start)
    const endItems = allItems.slice(end)
    const middleItems = showEllipsis ? [{ label: "...", href: undefined }] : []

    return [...startItems, ...middleItems, ...endItems]
  }, [allItems, maxItems, showEllipsis])

  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const isEllipsis = item.label === "..."

    const itemContent = (
      <>
        <span>{item.label}</span>
      </>
    )

    if (isEllipsis) {
      return (
        <span
          key={index}
          className={cn(
            "flex items-center text-muted-foreground",
            itemClassName
          )}
          aria-hidden="true"
        >
          {itemContent}
        </span>
      )
    }

    if (item.href && !isLast) {
      return (
        <a
          key={index}
          href={item.href}
          className={cn(
            "flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors",
            itemClassName
          )}
          onClick={item.onClick}
        >
          {itemContent}
        </a>
      )
    }

    return (
      <span
        key={index}
        className={cn(
          "flex items-center text-sm font-medium",
          isLast ? "text-foreground" : "text-muted-foreground",
          itemClassName
        )}
        aria-current={isLast ? "page" : undefined}
      >
        {itemContent}
      </span>
    )
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1", className)}
    >
      <ol className="flex items-center space-x-1">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1

          return (
            <li key={index} className="flex items-center">
              {renderItem(item, index, isLast)}
              {!isLast && (
                <span
                  className={cn(
                    "mx-2 text-muted-foreground",
                    separatorClassName
                  )}
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Hook for managing breadcrumb state
export function useBreadcrumbs(initialItems: BreadcrumbItem[] = []) {
  const [items, setItems] = React.useState<BreadcrumbItem[]>(initialItems)

  const addItem = React.useCallback((item: BreadcrumbItem) => {
    setItems(prev => [...prev, item])
  }, [])

  const removeItem = React.useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = React.useCallback((index: number, item: BreadcrumbItem) => {
    setItems(prev => prev.map((existing, i) => i === index ? item : existing))
  }, [])

  const clearItems = React.useCallback(() => {
    setItems([])
  }, [])

  const setItemsDirectly = React.useCallback((newItems: BreadcrumbItem[]) => {
    setItems(newItems)
  }, [])

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    setItems: setItemsDirectly,
  }
}

// Breadcrumb context for global state management
interface BreadcrumbContextType {
  items: BreadcrumbItem[]
  addItem: (item: BreadcrumbItem) => void
  removeItem: (index: number) => void
  updateItem: (index: number, item: BreadcrumbItem) => void
  clearItems: () => void
  setItems: (items: BreadcrumbItem[]) => void
}

const BreadcrumbContext = React.createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const breadcrumbs = useBreadcrumbs()

  return (
    <BreadcrumbContext.Provider value={breadcrumbs}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbContext() {
  const context = React.useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumbContext must be used within a BreadcrumbProvider")
  }
  return context
}

// Auto breadcrumb component that uses context
export function AutoBreadcrumb(props: Omit<BreadcrumbProps, 'items'>) {
  const { items } = useBreadcrumbContext()
  return <Breadcrumb items={items} {...props} />
} 