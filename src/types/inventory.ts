import { InventoryCategory, InventoryReason } from './common'

// Inventory item interface
export interface InventoryItem {
  id: string
  name: string
  item_name?: string
  category: 'drinks' | 'raw_material' | 'food' | 'utensils'
  description?: string
  current_stock: number
  min_stock_level: number
  // Legacy frontend aliases still used in several pages/components
  quantity?: number
  threshold?: number
  unit_price?: number
  cost?: number
  supplier?: string
  location?: string
  expiry_date?: Date
  is_active: boolean
  created_by?: string
  created_at: Date
  updated_at: Date
  last_updated?: Date
}

// Inventory log interface
export interface InventoryLog {
  id: string
  inventory_id: string
  item_id?: string
  action: 'add' | 'remove' | 'adjust' | 'correction'
  quantity_change: number
  change?: number
  previous_quantity: number
  new_quantity: number
  reason?: string
  notes?: string
  performed_by: string
  created_at: Date
  inventory?: InventoryItem
  item?: InventoryItem
}

// Inventory item with extended information
export interface InventoryItemWithDetails extends InventoryItem {
  logs: InventoryLog[]
  total_purchased: number
  total_used: number
  average_cost: number
  is_low_stock: boolean
  last_purchase_date?: Date
  last_usage_date?: Date
}

// Inventory log with extended information
export interface InventoryLogWithDetails extends InventoryLog {
  item_name: string
  item_category: InventoryCategory
  user_name: string
}

// Inventory creation/update form data
export interface InventoryFormData {
  item_name: string
  category: InventoryCategory
  quantity: number
  threshold: number
  cost?: number
}

// Inventory log creation form data
export interface InventoryLogFormData {
  item_id: string
  quantity_change: number
  reason: InventoryReason
  notes?: string
}

// Inventory search and filter options
export interface InventoryFilters {
  search?: string
  category?: ('drinks' | 'raw_material' | 'food' | 'utensils')[]
  low_stock?: boolean
  sortBy?: 'name' | 'category' | 'current_stock' | 'cost' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

// Inventory statistics
export interface InventoryStats {
  total_items: number
  total_value: number
  low_stock_items: number
  out_of_stock_items: number
  categories: {
    drinks: number
    raw_material: number
    food: number
    utensils: number
  }
  recent_activity: number
}

// Inventory alert interface
export interface InventoryAlert {
  id: string
  item_id: string
  type: 'low_stock' | 'out_of_stock' | 'threshold_reached'
  message: string
  is_read: boolean
  created_at: Date
}

// Inventory supplier interface
export interface InventorySupplier {
  id: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  created_at: Date
}

// Inventory purchase order interface
export interface PurchaseOrder {
  id: string
  supplier_id: string
  status: 'draft' | 'ordered' | 'received' | 'cancelled'
  total_cost: number
  order_date: Date
  expected_delivery?: Date
  received_date?: Date
  notes?: string
  created_by: string
  created_at: Date
}

// Purchase order item interface
export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  item_id: string
  quantity: number
  unit_cost: number
  total_cost: number
  received_quantity?: number
}

// Inventory import/export interface
export interface InventoryImportData {
  item_name: string
  category: string
  quantity: number
  threshold: number
  cost?: number
}

export interface InventoryExportData extends InventoryItem {
  is_low_stock: boolean
  total_purchased: number
  total_used: number
  average_cost: number
  last_purchase_date_formatted?: string
  last_usage_date_formatted?: string
  last_updated_formatted: string
}

// Inventory report interface
export interface InventoryReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: Date
  end_date: Date
  items: InventoryItemWithDetails[]
  total_purchases: number
  total_usage: number
  total_cost: number
  low_stock_alerts: number
}

// Inventory settings interface
export interface InventorySettings {
  default_threshold: number
  auto_alert_low_stock: boolean
  track_costs: boolean
  allow_negative_quantity: boolean
  require_reason_for_logs: boolean
  default_categories: InventoryCategory[]
}

// Inventory barcode interface
export interface InventoryBarcode {
  id: string
  item_id: string
  barcode: string
  is_active: boolean
  created_at: Date
}

// Inventory location interface
export interface InventoryLocation {
  id: string
  name: string
  description?: string
  is_default: boolean
  created_at: Date
}

// Inventory item with location
export interface InventoryItemWithLocation extends InventoryItem {
  location_id?: string
  location_name?: string
}

export interface CreateInventoryItemData {
  item_name: string
  category: 'drinks' | 'raw_material' | 'food' | 'utensils'
  quantity: number
  threshold: number
  cost?: number
}

export interface UpdateInventoryItemData {
  item_name?: string
  category?: 'drinks' | 'raw_material' | 'food' | 'utensils'
  quantity?: number
  threshold?: number
  cost?: number
}

export interface StockAdjustmentData {
  item_id: string
  change: number
  reason: 'purchase' | 'usage' | 'correction' | 'waste'
  notes?: string
}

export interface LowStockAlert {
  id: string
  item_name: string
  category: string
  current_quantity: number
  threshold: number
  cost: number | null
  last_updated: Date
}

export interface CategoryStats {
  category: string
  item_count: number
  total_quantity: number
  total_value: number
  low_stock_count: number
} 