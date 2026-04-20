import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { CustomerSegment } from '@/types/marketing'
import { toast } from 'sonner'

export function useMarketing() {
  const queryClient = useQueryClient()

  // Query for campaigns
  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    error: campaignsError
  } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const response = await api.get<{ campaigns: any[] }>('/api/marketing/campaigns')
      return response.data.campaigns || []
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Query for segments
  const {
    data: segments = [],
    isLoading: segmentsLoading,
    error: segmentsError
  } = useQuery({
    queryKey: ['marketing-segments'],
    queryFn: async () => {
      const response = await api.get<{ segments: CustomerSegment[] }>('/api/marketing/segments')
      return response.data.segments || []
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Query for analytics
  const {
    data: analytics = null,
    isLoading: analyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: ['marketing-analytics'],
    queryFn: async () => {
      const response = await api.get<{ analytics: any }>('/api/marketing/analytics')
      return response.data.analytics
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ campaign: any }>('/api/marketing/campaigns', data)
      return response.data.campaign
    },
    onMutate: async (newCampaignData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-campaigns'] })
      
      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(['marketing-campaigns'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-campaigns'], (old: any[] = []) => {
        const optimisticCampaign = {
          id: `temp-${Date.now()}`,
          ...newCampaignData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft',
          sent_count: 0,
          open_count: 0,
          click_count: 0
        }
        return [optimisticCampaign, ...old]
      })
      
      return { previousCampaigns }
    },
    onError: (err, newCampaign, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCampaigns) {
        queryClient.setQueryData(['marketing-campaigns'], context.previousCampaigns)
      }
      toast.error('Failed to create campaign', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
      toast.success('Campaign created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
    }
  })

  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put<{ campaign: any }>(`/api/marketing/campaigns/${id}`, data)
      return response.data.campaign
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-campaigns'] })
      
      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(['marketing-campaigns'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-campaigns'], (old: any[] = []) => {
        return old.map(campaign => 
          campaign.id === id 
            ? { ...campaign, ...data, updated_at: new Date().toISOString() }
            : campaign
        )
      })
      
      return { previousCampaigns }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCampaigns) {
        queryClient.setQueryData(['marketing-campaigns'], context.previousCampaigns)
      }
      toast.error('Failed to update campaign', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
      toast.success('Campaign updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
    }
  })

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/marketing/campaigns/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-campaigns'] })
      
      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(['marketing-campaigns'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-campaigns'], (old: any[] = []) => {
        return old.filter(campaign => campaign.id !== deletedId)
      })
      
      return { previousCampaigns }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCampaigns) {
        queryClient.setQueryData(['marketing-campaigns'], context.previousCampaigns)
      }
      toast.error('Failed to delete campaign', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
      toast.success('Campaign deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
    }
  })

  // Execute campaign mutation
  const executeCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ message: string }>(`/api/marketing/execute/${id}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-analytics'] })
      toast.success('Campaign executed successfully')
    },
    onError: (error) => {
      toast.error('Failed to execute campaign', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Create segment mutation
  const createSegment = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ segment: CustomerSegment }>('/api/marketing/segments', data)
      return response.data.segment
    },
    onMutate: async (newSegmentData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-segments'] })
      
      // Snapshot the previous value
      const previousSegments = queryClient.getQueryData(['marketing-segments'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-segments'], (old: CustomerSegment[] = []) => {
        const optimisticSegment: CustomerSegment = {
          id: `temp-${Date.now()}`,
          name: newSegmentData.name,
          description: newSegmentData.description,
          criteria: newSegmentData.criteria,
          customer_count: 0,
          is_active: true,
          created_by: 'system',
          created_at: new Date()
        }
        return [optimisticSegment, ...old]
      })
      
      return { previousSegments }
    },
    onError: (err, newSegment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSegments) {
        queryClient.setQueryData(['marketing-segments'], context.previousSegments)
      }
      toast.error('Failed to create segment', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
      toast.success('Segment created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
    }
  })

  // Update segment mutation
  const updateSegment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put<{ segment: CustomerSegment }>(`/api/marketing/segments/${id}`, data)
      return response.data.segment
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-segments'] })
      
      // Snapshot the previous value
      const previousSegments = queryClient.getQueryData(['marketing-segments'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-segments'], (old: CustomerSegment[] = []) => {
        return old.map(segment => 
          segment.id === id 
            ? { ...segment, ...data, updated_at: new Date().toISOString() }
            : segment
        )
      })
      
      return { previousSegments }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSegments) {
        queryClient.setQueryData(['marketing-segments'], context.previousSegments)
      }
      toast.error('Failed to update segment', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
      toast.success('Segment updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
    }
  })

  // Delete segment mutation
  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/marketing/segments/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['marketing-segments'] })
      
      // Snapshot the previous value
      const previousSegments = queryClient.getQueryData(['marketing-segments'])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['marketing-segments'], (old: CustomerSegment[] = []) => {
        return old.filter(segment => segment.id !== deletedId)
      })
      
      return { previousSegments }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSegments) {
        queryClient.setQueryData(['marketing-segments'], context.previousSegments)
      }
      toast.error('Failed to delete segment', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all marketing queries
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
      toast.success('Segment deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['marketing-segments'] })
    }
  })

  return {
    campaigns,
    segments,
    analytics,
    isLoading: campaignsLoading || segmentsLoading || analyticsLoading,
    error: campaignsError || segmentsError || analyticsError,
    createCampaign: createCampaign.mutateAsync,
    updateCampaign: updateCampaign.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
    executeCampaign: executeCampaign.mutateAsync,
    createSegment: createSegment.mutateAsync,
    updateSegment: updateSegment.mutateAsync,
    deleteSegment: deleteSegment.mutateAsync,
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending,
    isExecuting: executeCampaign.isPending,
    isCreatingSegment: createSegment.isPending,
    isUpdatingSegment: updateSegment.isPending,
    isDeletingSegment: deleteSegment.isPending
  }
}