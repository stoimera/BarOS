import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { api, ApiResponse, ApiError } from '@/lib/api/client'
import { toast } from 'sonner'

// Centralized query key factory for consistent cache management
export const queryKeys = {
  // Customer-related queries
  customers: {
    all: ['customers'] as const,
    lists: () => [['customers'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['customers'], 'list', filters] as const,
    details: () => [['customers'], 'detail'] as const,
    detail: (id: string) => [['customers'], 'detail', id] as const,
    withDetails: () => [['customers'], 'with-details'] as const,
    search: (search: string) => [['customers'], 'search', search] as const,
  },
  
  // Event-related queries
  events: {
    all: ['events'] as const,
    lists: () => [['events'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['events'], 'list', filters] as const,
    details: () => [['events'], 'detail'] as const,
    detail: (id: string) => [['events'], 'detail', id] as const,
    templates: () => [['events'], 'templates'] as const,
    template: (id: string) => [['events'], 'templates', id] as const,
    upcoming: () => [['events'], 'upcoming'] as const,
    past: () => [['events'], 'past'] as const,
  },
  
  // Booking-related queries
  bookings: {
    all: ['bookings'] as const,
    lists: () => [['bookings'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['bookings'], 'list', filters] as const,
    details: () => [['bookings'], 'detail'] as const,
    detail: (id: string) => [['bookings'], 'detail', id] as const,
    today: () => [['bookings'], 'today'] as const,
    upcoming: () => [['bookings'], 'upcoming'] as const,
    customer: (customerId: string) => [['bookings'], 'customer', customerId] as const,
  },
  
  // Inventory-related queries
  inventory: {
    all: ['inventory'] as const,
    lists: () => [['inventory'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['inventory'], 'list', filters] as const,
    details: () => [['inventory'], 'detail'] as const,
    detail: (id: string) => [['inventory'], 'detail', id] as const,
    stats: () => [['inventory'], 'stats'] as const,
    lowStockAlerts: () => [['inventory'], 'low-stock-alerts'] as const,
    category: (category: string) => [['inventory'], 'category', category] as const,
  },
  
  // Analytics-related queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [['analytics'], 'dashboard'] as const,
    financial: () => [['analytics'], 'financial'] as const,
    customer: () => [['analytics'], 'customer'] as const,
    inventory: () => [['analytics'], 'inventory'] as const,
    events: () => [['analytics'], 'events'] as const,
    bookings: () => [['analytics'], 'bookings'] as const,
  },
  
  // Task-related queries
  tasks: {
    all: ['tasks'] as const,
    lists: () => [['tasks'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['tasks'], 'list', filters] as const,
    details: () => [['tasks'], 'detail'] as const,
    detail: (id: string) => [['tasks'], 'detail', id] as const,
    assigned: (userId: string) => [['tasks'], 'assigned', userId] as const,
    status: (status: string) => [['tasks'], 'status', status] as const,
  },
  
  // Staff-related queries
  staff: {
    all: ['staff'] as const,
    lists: () => [['staff'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['staff'], 'list', filters] as const,
    details: () => [['staff'], 'detail'] as const,
    detail: (id: string) => [['staff'], 'detail', id] as const,
    active: () => [['staff'], 'active'] as const,
    positions: () => [['staff'], 'positions'] as const,
  },
  
  // Marketing-related queries
  marketing: {
    all: ['marketing'] as const,
    campaigns: () => [['marketing'], 'campaigns'] as const,
    campaign: (id: string) => [['marketing'], 'campaigns', id] as const,
    segments: () => [['marketing'], 'segments'] as const,
    segment: (id: string) => [['marketing'], 'segments', id] as const,
    analytics: () => [['marketing'], 'analytics'] as const,
  },
  
  // Visit-related queries
  visits: {
    all: ['visits'] as const,
    lists: () => [['visits'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['visits'], 'list', filters] as const,
    details: () => [['visits'], 'detail'] as const,
    detail: (id: string) => [['visits'], 'detail', id] as const,
    customer: (customerId: string) => [['visits'], 'customer', customerId] as const,
    today: () => [['visits'], 'today'] as const,
  },
  
  // Waitlist-related queries
  waitlist: {
    all: ['waitlist'] as const,
    lists: () => [['waitlist'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['waitlist'], 'list', filters] as const,
    details: () => [['waitlist'], 'detail'] as const,
    detail: (id: string) => [['waitlist'], 'detail', id] as const,
    active: () => [['waitlist'], 'active'] as const,
  },
  
  // Menu-related queries
  menu: {
    all: ['menu'] as const,
    items: () => [['menu'], 'items'] as const,
    item: (id: string) => [['menu'], 'items', id] as const,
    categories: () => [['menu'], 'categories'] as const,
    category: (id: string) => [['menu'], 'categories', id] as const,
    available: () => [['menu'], 'available'] as const,
  },
  
  // Profile-related queries
  profile: {
    all: ['profile'] as const,
    current: () => [['profile'], 'current'] as const,
    detail: (id: string) => [['profile'], 'detail', id] as const,
  },
  
  // Enhanced rewards queries
  rewards: {
    all: ['rewards'] as const,
    lists: () => [['rewards'], 'list'] as const,
    list: (filters?: Record<string, any>) => [['rewards'], 'list', filters] as const,
    details: () => [['rewards'], 'detail'] as const,
    detail: (id: string) => [['rewards'], 'detail', id] as const,
    customer: (customerId: string) => [['rewards'], 'customer', customerId] as const,
    active: () => [['rewards'], 'active'] as const,
  },
} as const

// Generic query hook with proper caching
export function useApiQuery<TData>(
  queryKey: readonly unknown[],
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<TData>, ApiError>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<TData>(endpoint, params)
      return response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    ...options,
  })
}

// Generic mutation hook with proper cache invalidation
export function useApiMutation<TData, TVariables>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, ApiError, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient()
  const { onSuccess: userOnSuccess, onError: userOnError, ...restOptions } = options ?? {}

  return useMutation<ApiResponse<TData>, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const response = await api.post<TData>(endpoint, variables)
      return response
    },
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, mutationContext) => {
      const resourceType = endpoint.split('/')[1]

      queryClient.invalidateQueries({
        queryKey: [resourceType],
        exact: false,
      })

      toast.success('Operation completed successfully')

      userOnSuccess?.(data, variables, onMutateResult, mutationContext)
    },
    onError: (error, variables, onMutateResult, mutationContext) => {
      toast.error(error.message || 'Operation failed')

      userOnError?.(error, variables, onMutateResult, mutationContext)
    },
  })
}

// Customer hooks with proper cache invalidation
export function useCustomers(filters?: Record<string, any>) {
  return useApiQuery(
    [['customers'], 'list', filters],
    '/customers',
    filters
  )
}

export function useCustomer(id: string) {
  return useApiQuery(
    [['customers'], 'detail', id],
    `/customers/${id}`
  )
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useApiMutation('/customers', {
    onSuccess: () => {
      // Invalidate customer-related queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'customer'] })
    }
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useApiMutation('/customers', {
    onSuccess: (data, variables: any) => {
      // Invalidate specific customer detail
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['customers', 'detail', variables.id] })
      }
      // Invalidate customer lists and analytics
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'customer'] })
    }
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useApiMutation('/customers', {
    onSuccess: () => {
      // Invalidate customer-related queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'customer'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

// Event hooks with proper cache invalidation
export function useEvents(filters?: Record<string, any>) {
  return useApiQuery(
    [['events'], 'list', filters],
    '/events',
    filters
  )
}

export function useEvent(id: string) {
  return useApiQuery(
    [['events'], 'detail', id],
    `/events/${id}`
  )
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useApiMutation('/events', {
    onSuccess: () => {
      // Invalidate event-related queries
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useApiMutation('/events', {
    onSuccess: (data, variables: any) => {
      // Invalidate specific event detail
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['events', 'detail', variables.id] })
      }
      // Invalidate event lists and analytics
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useApiMutation('/events', {
    onSuccess: () => {
      // Invalidate event-related queries
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'events'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

// Booking hooks with proper cache invalidation
export function useBookings(filters?: Record<string, any>) {
  return useApiQuery(
    [['bookings'], 'list', filters],
    '/bookings',
    filters
  )
}

export function useBooking(id: string) {
  return useApiQuery(
    [['bookings'], 'detail', id],
    `/bookings/${id}`
  )
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useApiMutation('/bookings', {
    onSuccess: () => {
      // Invalidate booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useApiMutation('/bookings', {
    onSuccess: (data, variables: any) => {
      // Invalidate specific booking detail
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', variables.id] })
      }
      // Invalidate booking lists and analytics
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  return useApiMutation('/bookings', {
    onSuccess: () => {
      // Invalidate booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

// Inventory hooks with proper cache invalidation
export function useInventory(filters?: Record<string, any>) {
  return useApiQuery(
    [['inventory'], 'list', filters],
    '/inventory',
    filters
  )
}

export function useInventoryItem(id: string) {
  return useApiQuery(
    [['inventory'], 'detail', id],
    `/inventory/${id}`
  )
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()
  return useApiMutation('/inventory', {
    onSuccess: () => {
      // Invalidate inventory-related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()
  return useApiMutation('/inventory', {
    onSuccess: (data, variables: any) => {
      // Invalidate specific inventory detail
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['inventory', 'detail', variables.id] })
      }
      // Invalidate inventory lists and analytics
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()
  return useApiMutation('/inventory', {
    onSuccess: () => {
      // Invalidate inventory-related queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

// Analytics hooks
export function useDashboardAnalytics() {
  return useApiQuery(
    [['analytics'], 'dashboard'],
    '/analytics/dashboard'
  )
}

export function useFinancialAnalytics() {
  return useApiQuery(
    [['analytics'], 'financial'],
    '/analytics/financial'
  )
}

export function useCustomerAnalytics() {
  return useApiQuery(
    [['analytics'], 'customer'],
    '/analytics/customer'
  )
}

export function useInventoryAnalytics() {
  return useApiQuery(
    [['analytics'], 'inventory'],
    '/analytics/inventory'
  )
}

export function useEventAnalytics() {
  return useApiQuery(
    [['analytics'], 'events'],
    '/analytics/events'
  )
}

export function useBookingAnalytics() {
  return useApiQuery(
    [['analytics'], 'bookings'],
    '/analytics/bookings'
  )
}

// Task hooks with proper cache invalidation
export function useTasks(filters?: Record<string, any>) {
  return useApiQuery(
    [['tasks'], 'list', filters],
    '/tasks',
    filters
  )
}

export function useTask(id: string) {
  return useApiQuery(
    [['tasks'], 'detail', id],
    `/tasks/${id}`
  )
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useApiMutation('/tasks', {
    onSuccess: () => {
      // Invalidate task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useApiMutation('/tasks', {
    onSuccess: (data, variables: any) => {
      // Invalidate specific task detail
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', variables.id] })
      }
      // Invalidate task lists and analytics
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useApiMutation('/tasks', {
    onSuccess: () => {
      // Invalidate task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
    }
  })
}

// Utility hooks for cache management
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  return (queryKey: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey })
  }
}

export function useClearQueries() {
  const queryClient = useQueryClient()
  return (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey })
  }
}

export function useResetQueries() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.resetQueries()
  }
}