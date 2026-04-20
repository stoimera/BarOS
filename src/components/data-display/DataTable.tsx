"use client"

import React, { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  className?: string
}

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  pagination?: boolean
  search?: boolean
  filters?: FilterConfig[]
  pageSize?: number
  title?: string
  description?: string
  actions?: React.ReactNode
  emptyMessage?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  className?: string
  onRowClick?: (item: T) => void
  selectable?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
}

export function DataTable<T extends object>(
  {
    data,
    columns,
    loading = false,
    error,
    onRetry,
    pagination = false,
    search = false,
    filters = [],
    pageSize = 10,
    title,
    description,
    actions,
    emptyMessage = "No data available",
    emptyIcon: EmptyIcon,
    className,
    onRowClick,
    selectable = false,
    onSelectionChange,
  }: DataTableProps<T>
) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data

    // Apply search
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => {
          const itemValue = (item as any)[key]
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase())
          }
          return itemValue === value
        })
      }
    })

    // Apply sorting
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aValue = (a as any)[sortConfig.key]
        const bValue = (b as any)[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, activeFilters, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData
    
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' as const }
          : null
      }
      return { key, direction: 'asc' as const }
    })
  }

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedItems([])
      onSelectionChange?.([])
    }
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected !== item)
    
    setSelectedItems(newSelection)
    onSelectionChange?.(newSelection)
  }

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading data">
            {search && <Skeleton className="h-10 w-64" />}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              {error}
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="ml-2">
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {(title || search || filters.length > 0 || actions) && (
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>

          {(search || filters.length > 0) && (
            <div className="flex flex-col sm:flex-row gap-4">
              {search && (
                <div className="relative flex-1 max-w-sm">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search data"
                  />
                </div>
              )}

              {filters.map((filter) => (
                <div key={filter.key} className="flex items-center gap-2">
                  <span className="text-sm font-medium">{filter.label}:</span>
                  {filter.type === 'select' ? (
                    <Select
                      value={activeFilters[filter.key] || ''}
                      onValueChange={(value) => 
                        setActiveFilters(prev => ({ ...prev, [filter.key]: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {filter.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={filter.placeholder}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => 
                        setActiveFilters(prev => ({ ...prev, [filter.key]: e.target.value }))
                      }
                      className="w-32"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            {EmptyIcon && <EmptyIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
            <h3 className="text-lg font-medium mb-2">No data found</h3>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="rounded border">
              <Table role="table" aria-label={title || "Data table"}>
                <TableHeader>
                  <TableRow>
                    {selectable && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                          aria-label="Select all items"
                        />
                      </TableHead>
                    )}
                    {columns.map((column) => (
                      <TableHead 
                        key={column.key}
                        className={cn(
                          column.sortable && "cursor-pointer hover:bg-muted/50",
                          column.width,
                          column.className
                        )}
                        onClick={() => column.sortable && handleSort(column.key)}
                        scope="col"
                        aria-sort={column.sortable && sortConfig?.key === column.key 
                          ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                          : undefined
                        }
                      >
                        <div className="flex items-center gap-2">
                          {column.header}
                          {column.sortable && sortConfig?.key === column.key && (
                            <Badge variant="secondary" className="text-xs">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        onRowClick && "cursor-pointer hover:bg-muted/50",
                        selectedItems.includes(item) && "bg-muted/50"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item)}
                            onChange={(e) => handleSelectItem(item, e.target.checked)}
                            className="rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select item ${index + 1}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.cell(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 