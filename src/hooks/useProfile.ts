import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Profile, ProfileFormData } from '@/types/customer'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

export function useProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Query for profile data
  const {
    data: profile = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<Profile>('/auth/profile')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.put<Profile>('/auth/profile', data)
      return response.data
    },
    onMutate: async (newProfileData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['profile'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['profile'], (old: Profile | null) => {
        if (!old) return null
        return { ...old, ...newProfileData, updated_at: new Date().toISOString() }
      })
      
      return { previousProfile }
    },
    onError: (err, newProfile, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
      toast.error('Failed to update profile', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  // Update password mutation
  const updatePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put<{ message: string }>('/auth/password', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Password updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update password', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.post<{ avatar_url: string }>('/auth/avatar', formData)
      return response.data.avatar_url
    },
    onMutate: async (file) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['profile'])
      
      // Create a temporary URL for the uploaded file
      const tempUrl = URL.createObjectURL(file)
      
      // Optimistically update to the new value
      queryClient.setQueryData(['profile'], (old: Profile | null) => {
        if (!old) return null
        return { ...old, avatar_url: tempUrl, updated_at: new Date().toISOString() }
      })
      
      return { previousProfile, tempUrl }
    },
    onError: (err, file, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
      // Clean up the temporary URL
      if (context?.tempUrl) {
        URL.revokeObjectURL(context.tempUrl)
      }
      toast.error('Failed to upload avatar', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Avatar uploaded successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  // Delete avatar mutation
  const deleteAvatar = useMutation({
    mutationFn: async () => {
      await api.delete('/auth/avatar')
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(['profile'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['profile'], (old: Profile | null) => {
        if (!old) return null
        return { ...old, avatar_url: null, updated_at: new Date().toISOString() }
      })
      
      return { previousProfile }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
      toast.error('Failed to delete avatar', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Avatar deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError) {
        throw userError
      }

      const userId = data.user?.id
      if (!userId) {
        throw new Error('No authenticated user found')
      }

      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Account deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete account', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateProfile.mutateAsync,
    updatePassword: updatePassword.mutateAsync,
    uploadAvatar: uploadAvatar.mutateAsync,
    deleteAvatar: deleteAvatar.mutateAsync,
    deleteAccount: deleteAccount.mutateAsync,
    isUpdating: updateProfile.isPending,
    isUpdatingPassword: updatePassword.isPending,
    isUploadingAvatar: uploadAvatar.isPending,
    isDeletingAvatar: deleteAvatar.isPending,
    isDeletingAccount: deleteAccount.isPending,
  }
}