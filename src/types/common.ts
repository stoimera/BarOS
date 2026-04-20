// Common types and interfaces used across the application

// Basic status and role types
export type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type RSVPStatus = 'going' | 'interested' | 'cancelled'
export type UserRole = 'admin' | 'customer'
export type InventoryCategory = 'drinks' | 'raw_material' | 'food' | 'utensils'
export type InventoryReason = 'purchase' | 'usage' | 'correction' | 'waste'

// Pagination parameters for data tables and lists
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Paginated response structure for API endpoints
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Standard API response structure
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Select option for dropdown components
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Table column configuration for data tables
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

// Filter option for data filtering
export interface FilterOption {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in'
  value: any
}

// Date range for filtering and date pickers
export interface DateRange {
  start: Date
  end: Date
}

// Notification structure for toast messages
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

// Breadcrumb navigation item
export interface Breadcrumb {
  label: string
  href?: string
  active?: boolean
}

// Sidebar navigation item
export interface SidebarItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: SidebarItem[]
}

// Statistics card for dashboard displays
export interface StatsCard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
}

// Quick action for dashboard shortcuts
export interface QuickAction {
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color?: 'default' | 'primary' | 'secondary'
}

// Recent activity for activity feeds
export interface RecentActivity {
  id: string
  type: 'customer' | 'event' | 'booking' | 'inventory'
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

// Staff member information
export interface Staff {
  id: string
  user_id: string
  name: string
  email: string
  role: StaffRole
  position: string
  hire_date: Date
  is_active: boolean
  permissions: StaffPermission[]
  created_at: Date
  updated_at: Date
}

// Staff role enumeration
export enum StaffRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  BARTENDER = 'bartender',
  SERVER = 'server',
  HOST = 'host',
  SECURITY = 'security',
  CLEANER = 'cleaner'
}

// Staff permission enumeration for role-based access control
export enum StaffPermission {
  VIEW_CUSTOMERS = 'view_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  VIEW_EVENTS = 'view_events',
  MANAGE_EVENTS = 'manage_events',
  VIEW_BOOKINGS = 'view_bookings',
  MANAGE_BOOKINGS = 'manage_bookings',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  VIEW_LOYALTY = 'view_loyalty',
  MANAGE_LOYALTY = 'manage_loyalty',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_STAFF = 'manage_staff',
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_FINANCIAL = 'manage_financial'
}

// Staff schedule for shift management
export interface StaffSchedule {
  id: string
  staff_id: string
  date: Date
  start_time: string
  end_time: string
  position: string
  notes?: string
  created_at: Date
}

// Staff performance metrics for evaluation
export interface StaffPerformance {
  id: string
  staff_id: string
  period_start: Date
  period_end: Date
  customers_served: number
  events_managed: number
  bookings_handled: number
  customer_rating: number
  manager_rating: number
  notes?: string
  created_at: Date
} 