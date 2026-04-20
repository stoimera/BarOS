import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBookings, createBooking, updateBooking, deleteBooking } from '@/lib/bookings'
import { BookingWithCustomer } from '@/types/booking'
import { toast } from 'sonner'

export function useBookings(filters?: {
  search?: string
  status?: ('pending' | 'confirmed' | 'cancelled' | 'completed')[]
  date_from?: Date
  date_to?: Date
  sortBy?: 'date' | 'time' | 'party_size' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}) {
  const queryClient = useQueryClient()
  
  // Create a stable query key
  const queryKey = ['bookings', filters]

  // Query for fetching bookings
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchBookings(filters || {})
      return response.data || []
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onMutate: async (newBookingData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BookingWithCustomer[] = []) => {
        const optimisticBooking: Partial<BookingWithCustomer> = {
          id: `temp-${Date.now()}`,
          customer_id: 'temp-customer-id',
          // Include both database and frontend fields for consistency
          booking_date: newBookingData.date.toISOString().split('T')[0],
          start_time: newBookingData.time,
          date: newBookingData.date.toISOString().split('T')[0],
          time: newBookingData.time,
          party_size: newBookingData.party_size,
          status: 'confirmed',
          notes: newBookingData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: {
            id: 'temp-customer-id',
            name: newBookingData.customer_name,
            email: newBookingData.customer_email,
            phone: newBookingData.customer_phone,
            tags: [],
            notes: '',
            created_at: new Date(),
            updated_at: new Date()
          }
        }
        return [optimisticBooking as BookingWithCustomer, ...old]
      })
      
      return { previousBookings }
    },
    onError: (err, newBooking, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKey, context.previousBookings)
      }
      toast.error('Failed to create booking', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch the specific query
      queryClient.invalidateQueries({ queryKey })
      toast.success('Booking created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBooking(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BookingWithCustomer[] = []) => {
        return old.map(booking => {
          if (booking.id === id) {
            const updates: Partial<BookingWithCustomer> = {}
            
            // Update both primary and legacy fields to match API response
            if (data.date !== undefined) {
              updates.booking_date = data.date.toISOString().split('T')[0]
              updates.date = data.date.toISOString().split('T')[0]
            }
            if (data.time !== undefined) {
              updates.start_time = data.time
              updates.time = data.time
            }
            if (data.party_size !== undefined) updates.party_size = data.party_size
            if (data.status !== undefined) updates.status = data.status
            if (data.notes !== undefined) updates.notes = data.notes
            
            updates.updated_at = new Date().toISOString()
            
            return { ...booking, ...updates }
          }
          return booking
        })
      })
      
      return { previousBookings }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKey, context.previousBookings)
      }
      toast.error('Failed to update booking', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch the specific query
      queryClient.invalidateQueries({ queryKey })
      toast.success('Booking updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    }
  })

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: deleteBooking,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData(queryKey)
      
      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: BookingWithCustomer[] = []) => {
        return old.filter(booking => booking.id !== deletedId)
      })
      
      return { previousBookings }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKey, context.previousBookings)
      }
      toast.error('Failed to delete booking', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch the specific query
      queryClient.invalidateQueries({ queryKey })
      toast.success('Booking deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    }
  })

  return {
    bookings,
    isLoading,
    error,
    refetch,
    createBooking: createBookingMutation.mutateAsync,
    updateBooking: updateBookingMutation.mutateAsync,
    deleteBooking: deleteBookingMutation.mutateAsync,
    isCreating: createBookingMutation.isPending,
    isUpdating: updateBookingMutation.isPending,
    isDeleting: deleteBookingMutation.isPending,
  }
}