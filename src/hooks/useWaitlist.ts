import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { WaitlistEntry } from '@/types/booking'
import { toast } from 'sonner'

export function useWaitlist(filters?: {
  date?: string
  status?: string
}) {
  const queryClient = useQueryClient()

  // Query for fetching waitlist entries
  const {
    data: waitlist = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['waitlist', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.date) params.append('date', filters.date)
      if (filters?.status) params.append('status', filters.status)
      
      const response = await api.get<{ waitlist: WaitlistEntry[] }>('/api/waitlist', {
        params: Object.fromEntries(params)
      })
      return response.data.waitlist || []
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Add to waitlist mutation
  const addToWaitlist = useMutation({
    mutationFn: async (data: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'>) => {
      const response = await api.post<{ waitlist_entry: WaitlistEntry }>('/api/waitlist', data)
      return response.data.waitlist_entry
    },
    onMutate: async (newWaitlistData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['waitlist'] })
      
      // Snapshot the previous value
      const previousWaitlist = queryClient.getQueryData(['waitlist', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['waitlist', filters], (old: WaitlistEntry[] = []) => {
        const optimisticEntry: WaitlistEntry = {
          id: `temp-${Date.now()}`,
          customer_name: newWaitlistData.customer_name,
          customer_email: newWaitlistData.customer_email,
          customer_phone: newWaitlistData.customer_phone,
          date: newWaitlistData.date,
          time: newWaitlistData.time,
          party_size: newWaitlistData.party_size,
          notes: newWaitlistData.notes,
          priority: newWaitlistData.priority || 'medium',
          status: 'waiting',
          created_at: new Date(),
          notified_at: undefined,
          booked_at: undefined
        }
        return [optimisticEntry, ...old]
      })
      
      return { previousWaitlist }
    },
    onError: (err, newEntry, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWaitlist) {
        queryClient.setQueryData(['waitlist', filters], context.previousWaitlist)
      }
      toast.error('Failed to add to waitlist', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all waitlist queries
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Added to waitlist successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    }
  })

  // Update waitlist entry mutation
  const updateWaitlistEntry = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WaitlistEntry> }) => {
      const response = await api.put<{ waitlist_entry: WaitlistEntry }>(`/api/waitlist/${id}`, data)
      return response.data.waitlist_entry
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['waitlist'] })
      
      // Snapshot the previous value
      const previousWaitlist = queryClient.getQueryData(['waitlist', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['waitlist', filters], (old: WaitlistEntry[] = []) => {
        return old.map(entry => 
          entry.id === id 
            ? { ...entry, ...data }
            : entry
        )
      })
      
      return { previousWaitlist }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWaitlist) {
        queryClient.setQueryData(['waitlist', filters], context.previousWaitlist)
      }
      toast.error('Failed to update waitlist entry', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all waitlist queries
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Waitlist entry updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    }
  })

  // Remove from waitlist mutation
  const removeFromWaitlist = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/waitlist/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['waitlist'] })
      
      // Snapshot the previous value
      const previousWaitlist = queryClient.getQueryData(['waitlist', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['waitlist', filters], (old: WaitlistEntry[] = []) => {
        return old.filter(entry => entry.id !== deletedId)
      })
      
      return { previousWaitlist }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWaitlist) {
        queryClient.setQueryData(['waitlist', filters], context.previousWaitlist)
      }
      toast.error('Failed to remove from waitlist', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all waitlist queries
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Removed from waitlist successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    }
  })

  return {
    waitlist,
    isLoading,
    error,
    refetch,
    addToWaitlist: addToWaitlist.mutateAsync,
    updateWaitlistEntry: updateWaitlistEntry.mutateAsync,
    removeFromWaitlist: removeFromWaitlist.mutateAsync,
    deleteWaitlistEntry: removeFromWaitlist.mutateAsync, // Alias for compatibility
    isAdding: addToWaitlist.isPending,
    isUpdating: updateWaitlistEntry.isPending,
    isRemoving: removeFromWaitlist.isPending,
    isDeleting: removeFromWaitlist.isPending, // Alias for compatibility
  }
} 