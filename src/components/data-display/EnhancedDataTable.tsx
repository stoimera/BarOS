"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  className?: string
  align?: 'left' | 'center' | 'right'
  renderHeader?: (column: ColumnDef<T>) => React.ReactNode
}

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
  onRetry?: () => void
  pagination?: boolean | PaginationConfig
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
  onSort?: (sortConfig: SortConfig | null) => void
  onFilter?: (filters: Record<string, any>) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  exportable?: boolean
  onExport?: (data: T[]) => void
  rowClassName?: (item: T) => string
  headerClassName?: string
  bodyClassName?: string
  virtualized?: boolean
  virtualizedItemHeight?: number
  virtualizedOverscan?: number
}

export function EnhancedDataTable<T extends object>(
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
    onSort,
    onFilter,
    onPageChange,
    exportable = false,
    onExport,
    rowClassName,
    headerClassName,
    bodyClassName,
  }: DataTableProps<T>
) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [showFilters, setShowFilters] = useState(false)

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
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => {
          const itemValue = (item as any)[key]
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase())
          }
          if (typeof value === 'number') {
            return Number(itemValue) === value
          }
          if (typeof value === 'boolean') {
            return Boolean(itemValue) === value
          }
          return itemValue === value
        })
      }
    })

    return result
  }, [data, searchTerm, activeFilters])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData
    
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    const newSortConfig = sortConfig?.key === key 
      ? (sortConfig.direction === 'asc' ? { key, direction: 'desc' as const } : null)
      : { key, direction: 'asc' as const }
    
    setSortConfig(newSortConfig)
    onSort?.(newSortConfig)
  }, [sortConfig, onSort])

  // Handle filtering
  const handleFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }, [activeFilters, onFilter])

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedItems([])
      onSelectionChange?.([])
    }
  }, [paginatedData, onSelectionChange])

  const handleSelectItem = useCallback((item: T, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected !== item)
    
    setSelectedItems(newSelection)
    onSelectionChange?.(newSelection)
  }, [selectedItems, onSelectionChange])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    onPageChange?.(page)
  }, [onPageChange])

  // Handle export
  const handleExport = useCallback(() => {
    onExport?.(sortedData)
  }, [sortedData, onExport])

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
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="ml-2"
                >
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
      {/* Header */}
      {(title || description || actions || search || filters.length > 0 || exportable) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {exportable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={sortedData.length === 0}
                >
                  Export
                </Button>
              )}
              {actions}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            {search && (
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {filters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
                {Object.keys(activeFilters).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(activeFilters).length}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && filters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <Select
                      value={activeFilters[filter.key] || ''}
                      onValueChange={(value) => handleFilter(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
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
                      type={filter.type}
                      placeholder={filter.placeholder}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilter(filter.key, e.target.value)}
                      min={filter.min}
                      max={filter.max}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardHeader>
      )}

      {/* Table */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={headerClassName}>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.className,
                      column.sortable && "cursor-pointer hover:bg-muted/50",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    {column.renderHeader ? (
                      column.renderHeader(column)
                    ) : (
                      <div className="flex items-center gap-2">
                        {column.header}
                        {column.sortable && (
                          <span className={cn(
                            "text-xs",
                            sortConfig?.key === column.key
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}>
                            {sortConfig?.key === column.key 
                              ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                              : '⇅'}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className={bodyClassName}>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {EmptyIcon && <EmptyIcon className="h-8 w-8 text-muted-foreground" />}
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      rowClassName?.(item)
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item)}
                          onCheckedChange={(checked) => handleSelectItem(item, !!checked)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${item}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.className,
                          column.align === 'center' && "text-center",
                          column.align === 'right' && "text-right"
                        )}
                      >
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 