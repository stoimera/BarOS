// API Response Types
export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  success: boolean
  message?: string
}

export interface ApiError {
  message: string
  code: string
  details?: any
  status?: number
}

// Request Types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  category?: string
}

export interface SearchParams {
  query: string
  filters?: Record<string, any>
}

// Generic CRUD Types
export interface CreateRequest<T> {
  data: Partial<T>
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<T>
}

export interface DeleteRequest {
  id: string
}

// List Response Types
export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Status Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type EventStatus = 'draft' | 'published' | 'cancelled'
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Sort Types
export type SortOrder = 'asc' | 'desc'
export type SortField = string

// Date Range Types
export interface DateRange {
  start: Date
  end: Date
}

// File Upload Types
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: number
}

// Analytics Types
export interface AnalyticsData {
  period: string
  metrics: Record<string, number>
  trends: Record<string, number>
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  filters?: Record<string, any>
  fields?: string[]
}

// Import Types
export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
} 