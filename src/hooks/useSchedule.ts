import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StaffMember, ShiftWithStaff, CreateShiftData, UpdateShiftData } from '@/types/schedule'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export function useSchedule(filters?: {
  staff_id?: string
  shift_type?: string
  date_from?: Date
  date_to?: Date
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for staff members
  const {
    data: staffMembers = [],
    isLoading: staffLoading,
    error: staffError
  } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      try {
        const response = await api.get<{ staff: StaffMember[] }>('/api/staff')
        return response.data.staff || []
      } catch (error) {
        console.error('Error fetching staff members in useSchedule:', error)
        // Return empty array instead of throwing to prevent page crash
        return []
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false, // Don't retry on error to prevent multiple failed requests
  })

  // Query for shifts
  const {
    data: shifts = [],
    isLoading: shiftsLoading,
    error: shiftsError,
    refetch
  } = useQuery({
    queryKey: ['shifts', filters],
    queryFn: async () => {
      try {
        const response = await api.get<{ shifts: ShiftWithStaff[] }>('/api/schedule', {
          params: filters
        })
        return response.data.shifts || []
      } catch (error) {
        console.error('Error fetching shifts in useSchedule:', error)
        // Return empty array instead of throwing to prevent page crash
        return []
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error to prevent multiple failed requests
  })

  // Query for current user shifts
  const {
    data: currentUserShifts = [],
    isLoading: currentUserShiftsLoading
  } = useQuery({
    queryKey: ['current-user-shifts'],
    queryFn: async () => {
      try {
        const response = await api.get<{ shifts: ShiftWithStaff[] }>('/api/schedule/my-shifts')
        return response.data.shifts || []
      } catch (error) {
        console.error('Error fetching current user shifts:', error)
        // Return empty array instead of throwing to prevent page crash
        return []
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error to prevent multiple failed requests
  })

  // Create shift mutation
  const createShift = useMutation({
    mutationFn: async (shiftData: CreateShiftData) => {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Unknown error', details: errorText };
        }
        
        throw new Error(`Shift creation failed: ${errorData.details || errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.shift || result;
    },
    onSuccess: () => {
      // Invalidate all shift-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-shifts'] });
      
      toast.success('Shift created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create shift: ${error.message}`);
    },
  });

  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateShiftData }) => {
      const response = await api.put<{ shift: ShiftWithStaff }>(`/api/schedule/${id}`, data)
      return response.data.shift
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shifts'] })
      
      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(['shifts', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['shifts', filters], (old: ShiftWithStaff[] = []) => {
        return old.map(shift => 
          shift.id === id 
            ? { ...shift, ...data, updated_at: new Date().toISOString() }
            : shift
        )
      })
      
      return { previousShifts }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousShifts) {
        queryClient.setQueryData(['shifts', filters], context.previousShifts)
      }
      toast.error('Failed to update shift', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all shift queries
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['current-user-shifts'] })
      toast.success('Shift updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['current-user-shifts'] })
    }
  })

  // Delete shift mutation
  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/schedule/${id}`);
      return response;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shifts'] })
      
      // Snapshot the previous value
      const previousShifts = queryClient.getQueryData(['shifts', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['shifts', filters], (old: ShiftWithStaff[] = []) => {
        return old.filter(shift => shift.id !== deletedId)
      })
      
      return { previousShifts }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousShifts) {
        queryClient.setQueryData(['shifts', filters], context.previousShifts)
      }
      toast.error('Failed to delete shift', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all shift queries
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['current-user-shifts'] })
      toast.success('Shift deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['current-user-shifts'] })
    }
  })

  return {
    staffMembers,
    shifts,
    currentUserShifts,
    isLoading: staffLoading || shiftsLoading || currentUserShiftsLoading,
    error: staffError || shiftsError,
    refetch,
    createShift: createShift.mutateAsync,
    updateShift: updateShift.mutateAsync,
    deleteShift: deleteShift.mutateAsync,
    isCreating: createShift.isPending,
    isUpdating: updateShift.isPending,
    isDeleting: deleteShift.isPending,
  }
}