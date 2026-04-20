import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCustomers, fetchCustomersWithDetails, insertCustomer, updateCustomer, deleteCustomer } from '@/lib/customers'
import { getEnhancedRewards } from '@/lib/enhanced-rewards'
import { getVisits } from '@/lib/visits'
import { CustomerWithDetails } from '@/types/customer'
import { toast } from 'sonner'

// Hook for managing customer data with React Query caching and optimistic updates
export function useCustomers(filters?: {
  search?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for fetching customers with pagination and search filters
  const {
    data: customersResponse,
    isLoading: customersLoading,
    error: customersError,
    refetch: refetchCustomers
  } = useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const response = await fetchCustomers(filters || {})
      return response
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Extract customers and count from response
  const customers = customersResponse?.data || []
  const totalCount = customersResponse?.count || 0

  // Query for customers with detailed information (loyalty, visits, etc.)
  const {
    data: customersWithDetails = [],
    isLoading: detailsLoading,
    error: detailsError
  } = useQuery({
    queryKey: ['customers-with-details'],
    queryFn: async () => {
      const response = await fetchCustomersWithDetails({ page: 1, limit: 100 })
      return response.data || []
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Query for enhanced rewards data
  const {
    data: rewards = [],
    isLoading: rewardsLoading
  } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      return await getEnhancedRewards()
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Query for customer visits data
  const {
    data: visits = [],
    isLoading: visitsLoading
  } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      return await getVisits()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation for creating new customers with optimistic updates
  const createCustomerMutation = useMutation({
    mutationFn: insertCustomer,
    onMutate: async (newCustomerData) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['customers'] })
      
      // Snapshot the previous value for rollback on error
      const previousCustomers = queryClient.getQueryData(['customers', filters])
      
      // Optimistically update the cache with new customer
      queryClient.setQueryData(['customers', filters], (old: any) => {
        const optimisticCustomer: CustomerWithDetails = {
          id: `temp-${Date.now()}`,
          ...newCustomerData,
          created_at: new Date(),
          updated_at: new Date(),
          total_visits: 0,
          loyalty: undefined,
          visits: []
        }
        return {
          data: [optimisticCustomer, ...(old?.data || [])],
          count: (old?.count || 0) + 1
        }
      })
      
      return { previousCustomers }
    },
    onError: (err, newCustomer, context) => {
      // Rollback optimistic update on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', filters], context.previousCustomers)
      }
      toast.error('Failed to create customer', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all customer queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
      toast.success('Customer created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
    }
  })

  // Mutation for updating existing customers with optimistic updates
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerWithDetails> }) => 
      updateCustomer(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['customers'] })
      
      // Snapshot the previous value for rollback on error
      const previousCustomers = queryClient.getQueryData(['customers', filters])
      
      // Optimistically update the cache with modified customer
      queryClient.setQueryData(['customers', filters], (old: any) => {
        return {
          ...old,
          data: old?.data?.map((customer: CustomerWithDetails) => 
            customer.id === id 
              ? { ...customer, ...data, updated_at: new Date() }
              : customer
          )
        }
      })
      
      return { previousCustomers }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', filters], context.previousCustomers)
      }
      toast.error('Failed to update customer', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all customer queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
      toast.success('Customer updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
    }
  })

  // Mutation for deleting customers with optimistic updates
  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['customers'] })
      
      // Snapshot the previous value for rollback on error
      const previousCustomers = queryClient.getQueryData(['customers', filters])
      
      // Optimistically update the cache by removing the customer
      queryClient.setQueryData(['customers', filters], (old: any) => {
        return {
          ...old,
          data: old?.data?.filter((customer: CustomerWithDetails) => customer.id !== deletedId),
          count: Math.max(0, (old?.count || 0) - 1)
        }
      })
      
      return { previousCustomers }
    },
    onError: (err, deletedId, context) => {
      // Rollback optimistic update on error
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers', filters], context.previousCustomers)
      }
      toast.error('Failed to delete customer', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all customer queries
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
      toast.success('Customer deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
    }
  })

  const bulkDeleteCustomersMutation = useMutation({
    mutationFn: async (customerIds: string[]) => {
      await Promise.all(customerIds.map((customerId) => deleteCustomer(customerId)))
      return customerIds
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
      toast.success(`Deleted ${deletedIds.length} customer${deletedIds.length === 1 ? '' : 's'} successfully`)
    },
    onError: (err) => {
      toast.error('Failed to delete selected customers', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-with-details'] })
    },
  })

  // Return all customer data and mutation functions
  return {
    customers,
    customersWithDetails,
    rewards,
    visits,
    totalCount,
    isLoading: customersLoading || detailsLoading || rewardsLoading || visitsLoading,
    error: customersError || detailsError,
    refetchCustomers,
    createCustomer: createCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    deleteCustomer: deleteCustomerMutation.mutateAsync,
    bulkDeleteCustomers: bulkDeleteCustomersMutation.mutateAsync,
    isCreating: createCustomerMutation.isPending,
    isUpdating: updateCustomerMutation.isPending,
    isDeleting: deleteCustomerMutation.isPending,
    isBulkDeleting: bulkDeleteCustomersMutation.isPending,
  }
}