'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

// React Query provider component for global data fetching configuration
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time before data is considered stale and needs refetching
            staleTime: 30 * 1000, // 30 seconds - data is fresh for 30 seconds
            
            // Time before inactive queries are garbage collected from cache
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            
            // Retry configuration for failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors like 404, 403)
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 3 times for server errors (5xx)
              return failureCount < 3
            },
            
            // Exponential backoff for retry delays
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Disable refetch on window focus to reduce unnecessary requests
            refetchOnWindowFocus: false,
            
            // Refetch data when network reconnects
            refetchOnReconnect: true,
            
            // Refetch data when component mounts
            refetchOnMount: true,
            
            // Don't show placeholder data to avoid confusion
            placeholderData: undefined,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            
            // 1 second delay before retry
            retryDelay: 1000,
          },
        },
      })
  )

  // Global error handler for query failures
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.error) {
        const error = event.query.state.error as Error
        // Only log non-4xx errors to avoid spam from expected client errors
        if (!error.message?.includes('404') && !error.message?.includes('403')) {
          console.error('Query error:', error)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient])

  // Global error handler for mutation failures
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'updated' && event.mutation.state.error) {
        const error = event.mutation.state.error as Error
        console.error('Mutation error:', error)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools for development debugging */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
} 