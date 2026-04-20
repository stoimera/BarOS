import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserProfile } from '@/types/auth'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export function useStaff(filters?: {
  search?: string
  role?: string
  status?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for staff members
  const {
    data: staff = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['staff', filters],
    queryFn: async () => {
      const response = await api.get<{ staff: UserProfile[] }>('/api/staff', {
        params: filters
      })
      return response.data.staff || []
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query for current user profile
  const {
    data: currentUser = null,
    isLoading: currentUserLoading
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/auth/profile')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Create staff member mutation
  const createStaff = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ staff: UserProfile }>('/api/staff', data)
      return response.data.staff
    },
    onMutate: async (newStaffData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['staff'] })
      
      // Snapshot the previous value
      const previousStaff = queryClient.getQueryData(['staff', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['staff', filters], (old: UserProfile[] = []) => {
        const optimisticStaff: UserProfile = {
          id: `temp-${Date.now()}`,
          user_id: `temp-user-${Date.now()}`, // Temporary user_id for optimistic update
          email: newStaffData.email,
          first_name: newStaffData.first_name,
          last_name: newStaffData.last_name,
          role: newStaffData.role || 'staff',
          avatar_url: newStaffData.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true // Default to active for new staff members
        }
        return [optimisticStaff, ...old]
      })
      
      return { previousStaff }
    },
    onError: (err, newStaff, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStaff) {
        queryClient.setQueryData(['staff', filters], context.previousStaff)
      }
      toast.error('Failed to create staff member', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all staff queries
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    }
  })

  // Update staff member mutation
  const updateStaff = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserProfile> }) => {
      const response = await api.put<{ staff: UserProfile }>(`/api/staff/${id}`, data)
      return response.data.staff
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['staff'] })
      
      // Snapshot the previous value
      const previousStaff = queryClient.getQueryData(['staff', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['staff', filters], (old: UserProfile[] = []) => {
        return old.map(staff => 
          staff.id === id 
            ? { ...staff, ...data, updated_at: new Date().toISOString() }
            : staff
        )
      })
      
      return { previousStaff }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStaff) {
        queryClient.setQueryData(['staff', filters], context.previousStaff)
      }
      toast.error('Failed to update staff member', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all staff queries
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    }
  })

  // Delete staff member mutation
  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/staff/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['staff'] })
      
      // Snapshot the previous value
      const previousStaff = queryClient.getQueryData(['staff', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['staff', filters], (old: UserProfile[] = []) => {
        return old.filter(staff => staff.id !== deletedId)
      })
      
      return { previousStaff }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStaff) {
        queryClient.setQueryData(['staff', filters], context.previousStaff)
      }
      toast.error('Failed to delete staff member', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all staff queries
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    }
  })

  return {
    staff,
    currentUser,
    isLoading: isLoading || currentUserLoading,
    error,
    refetch,
    createStaff: createStaff.mutateAsync,
    updateStaff: updateStaff.mutateAsync,
    deleteStaff: deleteStaff.mutateAsync,
    isCreating: createStaff.isPending,
    isUpdating: updateStaff.isPending,
    isDeleting: deleteStaff.isPending,
  }
}