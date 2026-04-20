import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { 
  InventoryItem, 
  InventoryLog, 
  CreateInventoryItemData, 
  UpdateInventoryItemData, 
  StockAdjustmentData,
  InventoryFilters, 
  InventoryStats,
  LowStockAlert,
  CategoryStats
} from '@/types/inventory'
import { api } from '@/lib/api/client'

// Optimization types
export interface StockPrediction {
  item_id: string
  item_name: string
  quantity: number
  days_until_stockout: number
  predicted_demand: number
  reorder_quantity: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface ReorderSuggestion {
  item_id: string
  item_name: string
  quantity: number
  suggested_quantity: number
  estimated_cost: number
  reason: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface InventoryAnalytics {
  total_items: number
  low_stock_items: number
  out_of_stock_items: number
  total_value: number
  top_selling_items: Array<{
    item_name: string
    quantity_sold: number
    revenue: number
  }>
  category_breakdown: Array<{
    category: string
    count: number
    value: number
  }>
}

export async function fetchInventory({ 
  search = '', 
  page = 1, 
  limit = 10,
  category,
  low_stock
}: InventoryFilters & { page?: number; limit?: number }) {
  try {
  
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (category && category.length > 0) params.append('category', category[0]);
    
    const { data } = await api.get<{ data: InventoryItem[]; count: number }>(`/api/inventory?${params.toString()}`);
    
    let filteredData = data.data || [];
    
    // Apply low_stock filter in JavaScript
    if (low_stock) {
      filteredData = filteredData.filter(item => item.current_stock <= item.min_stock_level);
    }

    return { data: filteredData, count: data.count || filteredData.length };
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    throw error;
  }
}

export async function fetchInventoryItemById(id: string): Promise<InventoryItem> {
  try {
  
    const { data } = await api.get<InventoryItem>(`/api/inventory/${id}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch inventory item by ID:', error);
    throw error;
  }
}

export async function createInventoryItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
  try {
    console.log('Creating inventory item with data:', itemData)
    const { data } = await api.post<InventoryItem>('/api/inventory', {
      name: itemData.item_name,
      category: itemData.category,
      current_stock: itemData.quantity,
      min_stock_level: itemData.threshold,
      cost: itemData.cost || null
    });
    return data;
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    throw error;
  }
}

export async function updateInventoryItem(id: string, updates: UpdateInventoryItemData): Promise<InventoryItem> {
  try {
    const updateData: any = {}
    
    // Map form fields to database fields
    if (updates.item_name !== undefined) updateData.name = updates.item_name
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.quantity !== undefined) updateData.current_stock = updates.quantity
    if (updates.threshold !== undefined) updateData.min_stock_level = updates.threshold
    if (updates.cost !== undefined) updateData.cost = updates.cost

    // Only update if there are actual changes
    if (Object.keys(updateData).length === 0) {
      // Return the existing item if no changes
      return await fetchInventoryItemById(id)
    }

    console.log('Updating inventory item:', id, 'with data:', updateData)
    const { data } = await api.put<InventoryItem>(`/api/inventory/${id}`, updateData);
    return data;
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    throw error;
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
  
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete inventory item');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    throw error;
  }
}

export async function adjustStock(adjustmentData: StockAdjustmentData): Promise<InventoryLog> {
  try {
  
    const { data } = await api.post<InventoryLog>('/api/inventory/adjust-stock', adjustmentData);
    return data;
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    throw error;
  }
}

export async function getInventoryStats(): Promise<InventoryStats> {
  try {
    // Use API client instead of server Supabase client
    const { data } = await api.get<{ data: InventoryItem[] }>('/api/inventory?limit=1000');
    
    if (!data.data) {
      return {
        total_items: 0,
        total_value: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        categories: {
          drinks: 0,
          raw_material: 0,
          food: 0,
          utensils: 0
        },
        recent_activity: 0
      };
    }

    const items = data.data;
    
    const stats: InventoryStats = {
      total_items: items.length,
      total_value: items.reduce((sum, item) => sum + (item.cost || 0) * item.current_stock, 0),
      low_stock_items: items.filter(item => item.current_stock <= item.min_stock_level).length,
      out_of_stock_items: items.filter(item => item.current_stock === 0).length,
      categories: {
        drinks: items.filter(item => item.category === 'drinks').length,
        raw_material: items.filter(item => item.category === 'raw_material').length,
        food: items.filter(item => item.category === 'food').length,
        utensils: items.filter(item => item.category === 'utensils').length
      },
      recent_activity: 0 // This would need to be calculated from logs
    }

    return stats;
  } catch (error) {
    console.error('Failed to fetch inventory stats:', error);
    // Return default stats on error
    return {
      total_items: 0,
      total_value: 0,
      low_stock_items: 0,
      out_of_stock_items: 0,
      categories: {
        drinks: 0,
        raw_material: 0,
        food: 0,
        utensils: 0
      },
      recent_activity: 0
    };
  }
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  try {
    // Use API client instead of server Supabase client
    const { data } = await api.get<{ data: InventoryItem[] }>('/api/inventory?limit=1000');
    
    if (!data.data) {
      return [];
    }
    
    // Filter items where current_stock <= min_stock_level and map to LowStockAlert format
    const lowStockItems = data.data
      .filter(item => item.current_stock <= item.min_stock_level)
      .map(item => ({
        id: item.id,
        item_name: item.name,
        category: item.category,
        current_quantity: item.current_stock,
        threshold: item.min_stock_level,
        cost: item.cost,
        last_updated: item.updated_at
      }))
      .sort((a, b) => (a.current_quantity / a.threshold) - (b.current_quantity / b.threshold)); // Sort by urgency
    
    return lowStockItems as LowStockAlert[];
  } catch (error) {
    console.error('Failed to fetch low stock alerts:', error);
    return [];
  }
}

export async function getInventoryLogs(itemId?: string, limit = 50): Promise<InventoryLog[]> {
  const supabase = await createServiceRoleClient()
  let query = supabase
    .from('logs_inventory')
    .select(`
      *,
      inventory (
        id,
        name,
        category
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (itemId) {
    query = query.eq('inventory_id', itemId)
  }

  const { data, error } = await query
  if (error) throw error

  return data as InventoryLog[]
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')

  if (error) throw error

  const items = data as InventoryItem[]
  const categories = ['drinks', 'raw_material', 'food', 'utensils']
  
  return categories.map(category => {
    const categoryItems = items.filter(item => item.category === category)
    return {
      category,
      item_count: categoryItems.length,
      total_quantity: categoryItems.reduce((sum, item) => sum + item.current_stock, 0),
      total_value: categoryItems.reduce((sum, item) => sum + (item.cost || 0) * item.current_stock, 0),
      low_stock_count: categoryItems.filter(item => item.current_stock <= item.min_stock_level).length
    }
  })
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'drinks':
      return 'bg-blue-100 text-blue-800'
    case 'raw_material':
      return 'bg-green-100 text-green-800'
    case 'food':
      return 'bg-orange-100 text-orange-800'
    case 'utensils':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'drinks':
      return '🍺'
    case 'raw_material':
      return '📦'
    case 'food':
      return '🍽️'
    case 'utensils':
      return '🔧'
    default:
      return '📋'
  }
}

export function getStockStatus(quantity: number, threshold: number): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  color: string
  icon: string
} {
  if (quantity === 0) {
    return {
      status: 'out-of-stock',
      color: 'bg-red-100 text-red-800',
      icon: '❌'
    }
  } else if (quantity <= threshold) {
    return {
      status: 'low-stock',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⚠️'
    }
  } else {
    return {
      status: 'in-stock',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    }
  }
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'N/A'
  const fixedAmount = Number(amount).toFixed(2)
  return `€${fixedAmount}`
}

export function getReasonLabel(reason: string): string {
  switch (reason) {
    case 'purchase':
      return 'Purchase'
    case 'usage':
      return 'Usage'
    case 'correction':
      return 'Correction'
    case 'waste':
      return 'Waste'
    default:
      return reason
  }
}

export function getReasonColor(reason: string): string {
  switch (reason) {
    case 'purchase':
      return 'bg-green-100 text-green-800'
    case 'usage':
      return 'bg-blue-100 text-blue-800'
    case 'correction':
      return 'bg-yellow-100 text-yellow-800'
    case 'waste':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

// Optimization functions
export async function predictLowStockItems(): Promise<StockPrediction[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('quantity', { ascending: true })

  if (error) throw error

  const items = data as InventoryItem[]
  
  // Simple prediction algorithm - in a real app, this would use historical data
  return items.slice(0, 10).map(item => {
    const currentStock = item.current_stock
    const threshold = item.min_stock_level
    const predictedDemand = Math.max(threshold * 0.8, 1) // Simple demand prediction
    const daysUntilStockout = Math.floor(currentStock / predictedDemand * 30) // Assuming monthly demand
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (daysUntilStockout <= 7) urgency = 'critical'
    else if (daysUntilStockout <= 14) urgency = 'high'
    else if (daysUntilStockout <= 30) urgency = 'medium'
    
    return {
      item_id: item.id,
      item_name: item.name,
      quantity: currentStock,
      days_until_stockout: daysUntilStockout,
      predicted_demand: predictedDemand,
      reorder_quantity: Math.max(threshold * 2, 10),
      urgency
    }
  })
}

export async function generateReorderSuggestions(): Promise<ReorderSuggestion[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('quantity', { ascending: true })

  if (error) throw error

  const items = data as InventoryItem[]
  
  // Filter items where current_stock <= min_stock_level
  const lowStockItems = items.filter(item => item.current_stock <= item.min_stock_level)
  
  return lowStockItems.map(item => {
    const currentStock = item.current_stock
    const threshold = item.min_stock_level
    const suggestedQuantity = Math.max(threshold * 2 - currentStock, threshold)
    const estimatedCost = (item.cost || 0) * suggestedQuantity
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (currentStock === 0) urgency = 'critical'
    else if (currentStock <= threshold * 0.2) urgency = 'high'
    else if (currentStock <= threshold * 0.5) urgency = 'medium'
    
    const reason = currentStock === 0 ? 'Out of stock' : 'Below threshold'
    
    return {
      item_id: item.id,
      item_name: item.name,
      quantity: currentStock,
      suggested_quantity: suggestedQuantity,
      estimated_cost: estimatedCost,
      reason,
      urgency
    }
  })
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*')

  if (error) throw error

  const items = data as InventoryItem[]
  
  const totalItems = items.length
  const lowStockItems = items.filter(item => item.current_stock <= item.min_stock_level).length
  const outOfStockItems = items.filter(item => item.current_stock === 0).length
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0) * item.current_stock, 0)
  
  // Simulate top selling items (in a real app, this would come from sales data)
  const topSellingItems = items.slice(0, 5).map(item => ({
    item_name: item.name,
    quantity_sold: Math.floor(Math.random() * 100) + 10,
    revenue: (item.cost || 0) * (Math.floor(Math.random() * 100) + 10)
  }))
  
  // Category breakdown
  const categoryBreakdown = ['drinks', 'raw_material', 'food', 'utensils'].map(category => {
    const categoryItems = items.filter(item => item.category === category)
    return {
      category,
      count: categoryItems.length,
      value: categoryItems.reduce((sum, item) => sum + (item.cost || 0) * item.current_stock, 0)
    }
  })
  
  return {
    total_items: totalItems,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
    total_value: totalValue,
    top_selling_items: topSellingItems,
    category_breakdown: categoryBreakdown
  }
} 