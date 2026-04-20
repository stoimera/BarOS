import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EventWithDetails, CreateEventData, UpdateEventData } from '@/types/event'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export function useEvents(filters?: {
  search?: string
  category?: string
  date_from?: Date
  date_to?: Date
  sortBy?: string
  sortOrder?: string
}) {
  const queryClient = useQueryClient()

  // Query for events
  const {
    data: events = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      try {
        const response = await api.get<{ events: EventWithDetails[] }>('/api/events', {
          params: filters
        })
        return response.data?.events || []
      } catch (error) {
        console.error('Error fetching events:', error)
        throw error // Re-throw to let React Query handle the error
      }
    },
    staleTime: 30 * 1000, // 30 seconds - data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
  })

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await api.post<{ event: EventWithDetails }>('/api/events', data)
      return response.data?.event
    },
    onMutate: async (newEventData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events'] })
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['events', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['events', filters], (old: EventWithDetails[] = []) => {
        const eventData = { ...newEventData };
        const optimisticEvent = {
          id: `temp-${Date.now()}`,
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          current_rsvps: 0,
          total_rsvps: 0,
          going_count: 0,
          interested_count: 0,
          checked_in_count: 0,
          creator_name: 'You',
          rsvps: []
        } as EventWithDetails
        return [optimisticEvent, ...old]
      })
      
      // Return a context object with the snapshotted value
      return { previousEvents }
    },
    onError: (err, newEvent, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', filters], context.previousEvents)
      }
      toast.error('Failed to create event', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: (newEvent) => {
      if (!newEvent) {
        toast.error('Failed to create event: Invalid response')
        return
      }
      
      // Invalidate and refetch all event queries
      queryClient.invalidateQueries({ 
        queryKey: ['events']
      })
      
      toast.success('Event created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEventData }) => {
      const response = await api.put<{ event: EventWithDetails }>(`/api/events/${id}`, data)
      return response.data?.event
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events'] })
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['events', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['events', filters], (old: EventWithDetails[] = []) => {
        return old.map(event => 
          event.id === id 
            ? { ...event, ...data, updated_at: new Date().toISOString() }
            : event
        )
      })
      
      return { previousEvents }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', filters], context.previousEvents)
      }
      toast.error('Failed to update event', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: (updatedEvent) => {
      if (!updatedEvent) {
        toast.error('Failed to update event: Invalid response')
        return
      }
      
      // Invalidate and refetch all event queries
      queryClient.invalidateQueries({ 
        queryKey: ['events']
      })
      
      toast.success('Event updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  // Delete event mutation
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/events/${id}`)
      return id
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events'] })
      
      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['events', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['events', filters], (old: EventWithDetails[] = []) => {
        return old.filter(event => event.id !== deletedId)
      })
      
      return { previousEvents }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', filters], context.previousEvents)
      }
      toast.error('Failed to delete event', {
        description: err instanceof Error ? err.message : 'Unknown error'
      })
    },
    onSuccess: (deletedId) => {
      if (!deletedId) {
        toast.error('Failed to delete event: Invalid response')
        return
      }
      
      // Invalidate and refetch all event queries
      queryClient.invalidateQueries({ 
        queryKey: ['events']
      })
      
      toast.success('Event deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  return {
    events,
    isLoading,
    error,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    isCreating: createEvent.isPending,
    isUpdating: updateEvent.isPending,
    isDeleting: deleteEvent.isPending,
    refreshEvents: refetch
  }
} 