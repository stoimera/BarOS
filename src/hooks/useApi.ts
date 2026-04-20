'use client'

import { useState, useEffect, useCallback } from 'react'
import { handleApiError } from '@/utils/error-handling'
import { toast } from 'sonner'

// Configuration options for API calls
interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  enabled?: boolean
  cacheTime?: number
  retryCount?: number
  retryDelay?: number
}

// State interface for API hook return value
interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Generic API hook for data fetching with caching and retry logic
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const {
    onSuccess,
    onError,
    enabled = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache time
    retryCount = 3,
    retryDelay = 1000
  } = options

  // Initialize state with loading and error handling
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    refetch: async () => {}
  })

  // Local cache for storing API responses
  const [cache, setCache] = useState<{
    data: T | null
    timestamp: number
  }>({ data: null, timestamp: 0 })

  // Execute API call with retry logic and exponential backoff
  const executeApiCall = useCallback(async (retryAttempt = 0): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const data = await apiCall()
      
      setState(prev => ({ ...prev, data, loading: false }))
      setCache({ data, timestamp: Date.now() })
      
      onSuccess?.(data)
    } catch (error) {
      const errorResult = handleApiError(error)
      
      // Implement retry logic with exponential backoff
      if (retryAttempt < retryCount) {
        const delay = retryDelay * Math.pow(2, retryAttempt)
        setTimeout(() => executeApiCall(retryAttempt + 1), delay)
        return
      }

      setState(prev => ({ ...prev, error: errorResult.error, loading: false }))
      onError?.(errorResult.error)
      toast.error(errorResult.error)
    }
  }, [apiCall, onSuccess, onError, retryCount, retryDelay])

  // Refetch function for manual data refresh
  const refetch = useCallback(async () => {
    await executeApiCall()
  }, [executeApiCall])

  // Effect to handle initial data fetching and cache checking
  useEffect(() => {
    if (!enabled) return

    // Check cache first before making API call
    const now = Date.now()
    if (cache.data && (now - cache.timestamp) < cacheTime) {
      setState(prev => ({ ...prev, data: cache.data }))
      return
    }

    executeApiCall()
  }, [enabled, cacheTime, executeApiCall, cache.data, cache.timestamp])

  return {
    ...state,
    refetch
  }
}

// Hook for data mutations (POST, PUT, DELETE operations)
export function useMutation<T, R>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void
    onError?: (error: string) => void
  } = {}
) {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    data: R | null
  }>({
    loading: false,
    error: null,
    data: null
  })

  // Execute mutation with error handling and success callbacks
  const mutate = useCallback(async (data: T): Promise<R | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const result = await mutationFn(data)
      
      setState(prev => ({ ...prev, data: result, loading: false }))
      options.onSuccess?.(result)
      
      return result
    } catch (error) {
      const errorResult = handleApiError(error)
      
      setState(prev => ({ ...prev, error: errorResult.error, loading: false }))
      options.onError?.(errorResult.error)
      toast.error(errorResult.error)
      
      return null
    }
  }, [mutationFn, options])

  return {
    ...state,
    mutate
  }
}

// Hook for optimistic updates with immediate UI feedback
export function useOptimisticMutation<T, R>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void
    onError?: (error: string) => void
    onOptimistic?: (data: T) => void
  } = {}
) {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    data: R | null
  }>({
    loading: false,
    error: null,
    data: null
  })

  // Execute mutation with optimistic update for immediate UI feedback
  const mutate = useCallback(async (data: T): Promise<R | null> => {
    try {
      // Apply optimistic update immediately
      options.onOptimistic?.(data)
      setState(prev => ({ ...prev, loading: true, error: null }))

      const result = await mutationFn(data)
      
      setState(prev => ({ ...prev, data: result, loading: false }))
      options.onSuccess?.(result)
      
      return result
    } catch (error) {
      const errorResult = handleApiError(error)
      
      setState(prev => ({ ...prev, error: errorResult.error, loading: false }))
      options.onError?.(errorResult.error)
      toast.error(errorResult.error)
      
      return null
    }
  }, [mutationFn, options])

  return {
    ...state,
    mutate
  }
} 