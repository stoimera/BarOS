import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EventTemplate } from '@/types/event'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export function useEventTemplates(filters?: {
  search?: string
  category?: string
  frequency?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for event templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['event-templates', filters],
    queryFn: async () => {
      const response = await api.get<{ templates: EventTemplate[] }>('/api/event-templates', {
        params: filters
      })
      return response.data.templates || []
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<{ template: EventTemplate }>('/api/event-templates', data)
      return response.data.template
    },
    onMutate: async (newTemplateData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event-templates'] })
      
      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['event-templates', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['event-templates', filters], (old: EventTemplate[] = []) => {
        const optimisticTemplate: EventTemplate = {
          id: `temp-${Date.now()}`,
          ...newTemplateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return [optimisticTemplate, ...old]
      })
      
      return { previousTemplates }
    },
    onError: (err, newTemplate, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplates) {
        queryClient.setQueryData(['event-templates', filters], context.previousTemplates)
      }
      toast.error('Failed to create event template', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all event template queries
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
      toast.success('Event template created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
    }
  })

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put<{ template: EventTemplate }>(`/api/event-templates/${id}`, data)
      return response.data.template
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event-templates'] })
      
      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['event-templates', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['event-templates', filters], (old: EventTemplate[] = []) => {
        return old.map(template => 
          template.id === id 
            ? { ...template, ...data, updated_at: new Date().toISOString() }
            : template
        )
      })
      
      return { previousTemplates }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplates) {
        queryClient.setQueryData(['event-templates', filters], context.previousTemplates)
      }
      toast.error('Failed to update event template', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all event template queries
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
      toast.success('Event template updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
    }
  })

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/event-templates/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event-templates'] })
      
      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['event-templates', filters])
      
      // Optimistically update to the new value
      queryClient.setQueryData(['event-templates', filters], (old: EventTemplate[] = []) => {
        return old.filter(template => template.id !== deletedId)
      })
      
      return { previousTemplates }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplates) {
        queryClient.setQueryData(['event-templates', filters], context.previousTemplates)
      }
      toast.error('Failed to delete event template', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: () => {
      // Invalidate and refetch all event template queries
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
      toast.success('Event template deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['event-templates'] })
    }
  })

  // Generate events from template mutation
  const generateEvents = useMutation({
    mutationFn: async ({ templateId, startDate, numberOfEvents }: {
      templateId: string
      startDate: Date
      numberOfEvents: number
    }) => {
      const response = await api.post<{ events: any[] }>(`/api/event-templates/${templateId}/generate`, {
        startDate,
        numberOfEvents
      })
      return response.data.events
    },
    onSuccess: (data) => {
      // Invalidate and refetch all event queries
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(`Generated ${data.length} events successfully`)
    },
    onError: (error) => {
      toast.error('Failed to generate events', { 
        description: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
    generateEvents: generateEvents.mutateAsync,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
    isGenerating: generateEvents.isPending,
  }
}