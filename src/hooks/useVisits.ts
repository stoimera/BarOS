import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { VisitWithDetails, VisitType } from '@/types/visit'
import { toast } from 'sonner'

interface VisitStatsResponse {
  totalVisits: number
  todayVisits: number
  thisWeekVisits: number
  thisMonthVisits: number
}

export function useVisits(filters?: {
  search?: string
  visit_type?: VisitType
  date_from?: Date
  date_to?: Date
  status?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for fetching visits
  const {
    data: visitsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['visits', filters],
    queryFn: async () => {
      const response = await api.get<{ data: VisitWithDetails[], count: number }>('/visits', filters)
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query for visit stats
  const {
    data: visitStats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['visit-stats'],
    queryFn: async () => {
      const response = await api.get<VisitStatsResponse>('/visits/stats')
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Create visit mutation
  const createVisit = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ visit: VisitWithDetails }>('/visits', data)
      return response.data.visit
    },
    onMutate: async (newVisitData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['visits'] })
      
      // Snapshot the previous value
      const previousVisits = queryClient.getQueryData(['visits', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['visits', filters], (old: { data: VisitWithDetails[], count: number } | undefined) => {
        const currentVisits = old?.data || []
        const optimisticVisit: VisitWithDetails = {
          id: `temp-${Date.now()}`,
          customer_id: newVisitData.customer_id,
          staff_id: newVisitData.staff_id,
          visit_date: new Date(),
          visit_type: newVisitData.visit_type || 'regular',
          loyalty_points_earned: 0,
          rewards_triggered: [],
          notes: newVisitData.notes,
          check_in_time: new Date(),
          check_out_time: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          customer: undefined, // Will be populated when refetched
          staff: undefined // Will be populated when refetched
        }
        return {
          data: [optimisticVisit, ...currentVisits],
          count: (old?.count || 0) + 1
        }
      })
      
      return { previousVisits }
    },
    onError: (err, newVisit, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits)
      }
      toast.error('Failed to create visit', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all visit queries
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
      toast.success('Visit created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
    }
  })

  // Update visit mutation
  const updateVisit = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put<{ visit: VisitWithDetails }>(`/visits/${id}`, data)
      return response.data.visit
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['visits'] })
      
      // Snapshot the previous value
      const previousVisits = queryClient.getQueryData(['visits', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['visits', filters], (old: { data: VisitWithDetails[], count: number } | undefined) => {
        const currentVisits = old?.data || []
        return {
          data: currentVisits.map(visit => 
            visit.id === id 
              ? { ...visit, ...data, updated_at: new Date() }
              : visit
          ),
          count: old?.count || 0
        }
      })
      
      return { previousVisits }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits)
      }
      toast.error('Failed to update visit', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all visit queries
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
      toast.success('Visit updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
    }
  })

  // Delete visit mutation
  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/visits/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['visits'] })
      
      // Snapshot the previous value
      const previousVisits = queryClient.getQueryData(['visits', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['visits', filters], (old: { data: VisitWithDetails[], count: number } | undefined) => {
        const currentVisits = old?.data || []
        return {
          data: currentVisits.filter(visit => visit.id !== deletedId),
          count: Math.max((old?.count || 0) - 1, 0)
        }
      })
      
      return { previousVisits }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits)
      }
      toast.error('Failed to delete visit', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all visit queries
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
      toast.success('Visit deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit-stats'] })
    }
  })

  return {
    visits: visitsResponse?.data || [],
    totalCount: visitsResponse?.count || 0,
    visitStats,
    isLoading,
    statsLoading,
    error,
    refetch,
    createVisit: createVisit.mutateAsync,
    updateVisit: updateVisit.mutateAsync,
    deleteVisit: deleteVisit.mutateAsync,
    isCreating: createVisit.isPending,
    isUpdating: updateVisit.isPending,
    isDeleting: deleteVisit.isPending,
  }
}