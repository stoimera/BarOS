import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock } from '@/lib/inventory'
import { getInventoryStats, getLowStockAlerts } from '@/lib/inventory'
import { InventoryItem } from '@/types/inventory'
import { toast } from 'sonner'

export function useInventory(filters?: {
  search?: string
  category?: ('drinks' | 'raw_material' | 'food' | 'utensils')[]
  low_stock?: boolean
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Create a stable query key by stringifying the filters
  const queryKey = ['inventory', JSON.stringify(filters || {})]

  // Query for fetching inventory
  const {
    data: inventoryResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchInventory(filters || {})
      return response
    },
    staleTime: 0, // Temporarily set to 0 to force immediate refetching
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const inventory = inventoryResponse?.data || []
  const totalCount = inventoryResponse?.count || 0

  // Query for inventory stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: getInventoryStats,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Query for low stock alerts
  const {
    data: lowStockAlerts = [],
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: getLowStockAlerts,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create inventory item mutation
  const createInventoryItemMutation = useMutation({
    mutationFn: createInventoryItem,
    onMutate: async (newItemData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory'] })
      
      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => {
        const optimisticItem: InventoryItem = {
          id: `temp-${Date.now()}`,
          name: newItemData.item_name,
          category: newItemData.category,
          description: '',
          current_stock: newItemData.quantity,
          min_stock_level: newItemData.threshold,
          cost: newItemData.cost || undefined,
          unit_price: undefined,
          supplier: '',
          location: '',
          expiry_date: undefined,
          is_active: true,
          created_by: '',
          created_at: new Date(),
          updated_at: new Date()
        }
        return {
          data: [optimisticItem, ...(old?.data || [])],
          count: (old?.count || 0) + 1
        }
      })
      
      return { previousInventory }
    },
    onError: (err, newItem, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInventory) {
        queryClient.setQueryData(queryKey, context.previousInventory)
      }
      toast.error('Failed to create inventory item', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      toast.success('Inventory item created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
    }
  })

  // Update inventory item mutation
  const updateInventoryItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      console.log('Mutation function called with:', { id, data })
      return updateInventoryItem(id, data)
    },
    onMutate: async ({ id, data }) => {
      console.log('onMutate called with:', { id, data })
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory'] })
      
      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(queryKey)
      
      // Map form fields to database fields for optimistic update
      const mappedUpdates: Partial<InventoryItem> = {}
      if (data.item_name !== undefined) mappedUpdates.name = data.item_name
      if (data.category !== undefined) mappedUpdates.category = data.category
      if (data.quantity !== undefined) mappedUpdates.current_stock = data.quantity
      if (data.threshold !== undefined) mappedUpdates.min_stock_level = data.threshold
      if (data.cost !== undefined) mappedUpdates.cost = data.cost
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((item: InventoryItem) => 
            item.id === id 
              ? { ...item, ...mappedUpdates, updated_at: new Date() }
              : item
          )
        }
      })
      
      return { previousInventory }
    },
    onError: (err, variables, context) => {
      console.error('Mutation error:', err)
      console.error('Mutation variables:', variables)
      console.error('Mutation context:', context)
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInventory) {
        queryClient.setQueryData(queryKey, context.previousInventory)
      }
      toast.error('Failed to update inventory item', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: (data, variables) => {
      console.log('Mutation success:', data)
      console.log('Mutation variables:', variables)
      console.log('Current query key:', queryKey)
      // Invalidate and refetch all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      // Force a refetch of the current query
      console.log('Forcing refetch...')
      refetch()
      toast.success('Inventory item updated successfully')
    },
    onSettled: () => {
      console.log('Mutation settled')
      console.log('Current query key:', queryKey)
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      // Force a refetch of the current query
      console.log('Forcing refetch in onSettled...')
      refetch()
    }
  })

  // Delete inventory item mutation
  const deleteInventoryItemMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory'] })
      
      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          ...old,
          data: old?.data?.filter((item: InventoryItem) => item.id !== deletedId),
          count: Math.max(0, (old?.count || 0) - 1)
        }
      })
      
      return { previousInventory }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInventory) {
        queryClient.setQueryData(queryKey, context.previousInventory)
      }
      toast.error('Failed to delete inventory item', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      toast.success('Inventory item deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
    }
  })

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: adjustStock,
    onMutate: async ({ item_id, change, reason: _reason }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory'] })
      
      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          ...old,
          data: old?.data?.map((item: InventoryItem) => 
            item.id === item_id 
              ? { 
                  ...item, 
                  current_stock: Math.max(0, item.current_stock + change),
                  updated_at: new Date(),
                  // Note: low_stock_alert is not a field in InventoryItem, so we'll remove this
                }
              : item
          )
        }
      })
      
      void _reason
      return { previousInventory }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInventory) {
        queryClient.setQueryData(queryKey, context.previousInventory)
      }
      toast.error('Failed to adjust stock', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      toast.success('Stock adjusted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
    }
  })

  return {
    inventory,
    stats,
    lowStockAlerts,
    totalCount,
    isLoading: isLoading || statsLoading || alertsLoading,
    error,
    refetch,
    createInventoryItem: createInventoryItemMutation.mutateAsync,
    updateInventoryItem: updateInventoryItemMutation.mutateAsync,
    deleteInventoryItem: deleteInventoryItemMutation.mutateAsync,
    adjustStock: adjustStockMutation.mutateAsync,
    isCreating: createInventoryItemMutation.isPending,
    isUpdating: updateInventoryItemMutation.isPending,
    isDeleting: deleteInventoryItemMutation.isPending,
    isAdjusting: adjustStockMutation.isPending,
  }
}