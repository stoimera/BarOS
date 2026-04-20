import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types/task'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export function useTasks(filters?: {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  category?: TaskCategory
  assigned_to?: string
  due_date?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  // Query for fetching tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await api.get<{ tasks: Task[] }>('/api/tasks', {
        params: filters
      })
      return response.data.tasks || []
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post<{ task: Task }>('/api/tasks', taskData)
      return response.data.task
    },
    onMutate: async (newTaskData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot all task queries
      const previousQueries = new Map()
      
      // Get all existing task queries and update them optimistically
      queryClient.getQueriesData({ queryKey: ['tasks'] }).forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          previousQueries.set(queryKey, queryData)
          
          // Optimistically update this specific query
          queryClient.setQueryData(queryKey, (old: Task[] = []) => {
            const optimisticTask: Task = {
              id: `temp-${Date.now()}`,
              ...newTaskData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status: newTaskData.status || 'todo',
              priority: newTaskData.priority || 'medium',
              category: newTaskData.category || 'general',
              assigned_to: newTaskData.assigned_to || null,
              assigned_by: newTaskData.assigned_by || null,
              due_date: newTaskData.due_date || new Date().toISOString().split('T')[0],
              completed_at: null,
              tags: newTaskData.tags || [],
              description: newTaskData.description || '',
              created_by: newTaskData.created_by || ''
            }
            return [optimisticTask, ...old]
          })
        }
      })
      
      return { previousQueries }
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueries) {
        context.previousQueries.forEach((queryData, queryKey) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
      toast.error('Failed to create task', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: (createdTask) => {
      // Invalidate and refetch all task queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Also set the individual task query if needed
      if (createdTask) {
        queryClient.setQueryData(['tasks', 'detail', createdTask.id], createdTask)
      }
      
      toast.success('Task created successfully')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Force refetch to ensure all components get the latest data
      queryClient.refetchQueries({ queryKey: ['tasks'] })
    }
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const response = await api.put<{ task: Task }>(`/api/tasks/${id}`, data)
      return response.data.task
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot all task queries
      const previousQueries = new Map()
      
      // Get all existing task queries and update them optimistically
      queryClient.getQueriesData({ queryKey: ['tasks'] }).forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          previousQueries.set(queryKey, queryData)
          
          // Optimistically update this specific query
          queryClient.setQueryData(queryKey, (old: Task[] = []) => {
            return old.map(task => 
              task.id === id 
                ? { ...task, ...data, updated_at: new Date().toISOString() }
                : task
            )
          })
        }
      })
      
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueries) {
        context.previousQueries.forEach((queryData, queryKey) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
      toast.error('Failed to update task', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: (updatedTask) => {
      // Invalidate and refetch all task queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Also update any individual task queries if they exist
      queryClient.setQueryData(['tasks', 'detail', updatedTask.id], updatedTask)
      
      toast.success('Task updated successfully')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Force refetch to ensure all components get the latest data
      queryClient.refetchQueries({ queryKey: ['tasks'] })
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}`)
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot all task queries
      const previousQueries = new Map()
      
      // Get all existing task queries and update them optimistically
      queryClient.getQueriesData({ queryKey: ['tasks'] }).forEach(([queryKey, queryData]) => {
        if (Array.isArray(queryData)) {
          previousQueries.set(queryKey, queryData)
          
          // Optimistically update this specific query
          queryClient.setQueryData(queryKey, (old: Task[] = []) => {
            return old.filter(task => task.id !== deletedId)
          })
        }
      })
      
      return { previousQueries }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueries) {
        context.previousQueries.forEach((queryData, queryKey) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }
      toast.error('Failed to delete task', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      })
    },
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch all task queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Remove any individual task queries
      queryClient.removeQueries({ queryKey: ['tasks', 'detail', deletedId] })
      
      toast.success('Task deleted successfully')
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      // Force refetch to ensure all components get the latest data
      queryClient.refetchQueries({ queryKey: ['tasks'] })
    }
  })

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  }
} 