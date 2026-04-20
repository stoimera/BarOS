import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Cache entry with timestamp and TTL for data expiration
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

// Global data store state for caching and optimistic updates
interface DataState {
  // Cache for different data types with TTL-based expiration
  cache: {
    customers: Record<string, CacheEntry<any>>
    events: Record<string, CacheEntry<any>>
    bookings: Record<string, CacheEntry<any>>
    inventory: Record<string, CacheEntry<any>>
    analytics: Record<string, CacheEntry<any>>
    tasks: Record<string, CacheEntry<any>>
  }
  
  // Optimistic updates for immediate UI feedback
  optimisticUpdates: Record<string, any>
  
  // Data relationships and dependencies for cache invalidation
  dependencies: Record<string, string[]>
  
  // Cache performance statistics
  stats: {
    hits: number
    misses: number
    size: number
  }
}

// Data store actions for cache management and optimistic updates
interface DataActions {
  // Cache management operations
  setCache: <T>(key: string, data: T, ttl?: number) => void
  getCache: <T>(key: string) => T | null
  clearCache: (key?: string) => void
  clearExpiredCache: () => void
  
  // Optimistic update operations for immediate UI feedback
  setOptimisticUpdate: (key: string, data: any) => void
  clearOptimisticUpdate: (key: string) => void
  applyOptimisticUpdate: (key: string) => void
  
  // Dependency management for cache invalidation
  addDependency: (key: string, dependencies: string[]) => void
  invalidateDependencies: (key: string) => void
  
  // Cache utility functions
  isExpired: (key: string) => boolean
  getCacheStats: () => DataState['stats']
  clearAllCache: () => void
}

type DataStore = DataState & DataActions

// Default cache TTL of 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000

// Create data store with subscription support for real-time updates
export const useDataStore = create<DataStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // Initialize empty cache and state
      cache: {
        customers: {},
        events: {},
        bookings: {},
        inventory: {},
        analytics: {},
        tasks: {}
      },
      optimisticUpdates: {},
      dependencies: {},
      stats: {
        hits: 0,
        misses: 0,
        size: 0
      },

      // Store data in cache with optional TTL
      setCache: (key, data, ttl = DEFAULT_TTL) => {
        const timestamp = Date.now()
        const cacheKey = key.split(':')[0] as keyof DataState['cache']
        
        set((state) => ({
          cache: {
            ...state.cache,
            [cacheKey]: {
              ...state.cache[cacheKey],
              [key]: {
                data,
                timestamp,
                ttl
              }
            }
          },
          stats: {
            ...state.stats,
            size: Object.keys(state.cache).reduce((acc, cacheType) => 
              acc + Object.keys(state.cache[cacheType as keyof DataState['cache']]).length, 0
            )
          }
        }))
      },

      // Retrieve data from cache with expiration check
      getCache: (key) => {
        const cacheKey = key.split(':')[0] as keyof DataState['cache']
        const entry = get().cache[cacheKey][key]
        
        if (!entry) {
          set((state) => ({
            stats: { ...state.stats, misses: state.stats.misses + 1 }
          }))
          return null
        }
        
        if (get().isExpired(key)) {
          get().clearCache(key)
          set((state) => ({
            stats: { ...state.stats, misses: state.stats.misses + 1 }
          }))
          return null
        }
        
        set((state) => ({
          stats: { ...state.stats, hits: state.stats.hits + 1 }
        }))
        
        return entry.data
      },

      // Clear specific cache entry or all cache
      clearCache: (key) => {
        if (!key) {
          set({
            cache: {
              customers: {},
              events: {},
              bookings: {},
              inventory: {},
              analytics: {},
              tasks: {}
            },
            stats: { hits: 0, misses: 0, size: 0 }
          })
          return
        }
        
        const cacheKey = key.split(':')[0] as keyof DataState['cache']
        set((state) => {
          const newCache = { ...state.cache[cacheKey] }
          delete newCache[key]
          
          return {
            cache: {
              ...state.cache,
              [cacheKey]: newCache
            },
            stats: {
              ...state.stats,
              size: Object.keys(state.cache).reduce((acc, cacheType) => 
                acc + Object.keys(state.cache[cacheType as keyof DataState['cache']]).length, 0
              )
            }
          }
        })
      },

      // Remove expired cache entries
      clearExpiredCache: () => {
        const now = Date.now()
        set((state) => {
          const newCache = { ...state.cache }
          
          Object.keys(newCache).forEach((cacheType) => {
            const cacheEntries = newCache[cacheType as keyof DataState['cache']]
            Object.keys(cacheEntries).forEach((key) => {
              const entry = cacheEntries[key]
              if (now - entry.timestamp > entry.ttl) {
                delete cacheEntries[key]
              }
            })
          })
          
          return {
            cache: newCache,
            stats: {
              ...state.stats,
              size: Object.keys(newCache).reduce((acc, cacheType) => 
                acc + Object.keys(newCache[cacheType as keyof DataState['cache']]).length, 0
              )
            }
          }
        })
      },

      // Set optimistic update for immediate UI feedback
      setOptimisticUpdate: (key, data) => {
        set((state) => ({
          optimisticUpdates: {
            ...state.optimisticUpdates,
            [key]: data
          }
        }))
      },

      // Clear optimistic update
      clearOptimisticUpdate: (key) => {
        set((state) => {
          const newUpdates = { ...state.optimisticUpdates }
          delete newUpdates[key]
          return { optimisticUpdates: newUpdates }
        })
      },

      // Apply optimistic update to cache
      applyOptimisticUpdate: (key) => {
        const update = get().optimisticUpdates[key]
        if (update) {
          get().setCache(key, update)
          get().clearOptimisticUpdate(key)
        }
      },

      // Add dependency relationship for cache invalidation
      addDependency: (key, dependencies) => {
        set((state) => ({
          dependencies: {
            ...state.dependencies,
            [key]: dependencies
          }
        }))
      },

      // Invalidate dependent cache entries
      invalidateDependencies: (key) => {
        const deps = get().dependencies[key] || []
        deps.forEach((depKey) => {
          get().clearCache(depKey)
        })
      },

      // Check if cache entry has expired
      isExpired: (key) => {
        const cacheKey = key.split(':')[0] as keyof DataState['cache']
        const entry = get().cache[cacheKey][key]
        if (!entry) return true
        
        return Date.now() - entry.timestamp > entry.ttl
      },

      // Get cache performance statistics
      getCacheStats: () => {
        return get().stats
      },

      // Clear all cache and reset statistics
      clearAllCache: () => {
        set({
          cache: {
            customers: {},
            events: {},
            bookings: {},
            inventory: {},
            analytics: {},
            tasks: {}
          },
          optimisticUpdates: {},
          dependencies: {},
          stats: { hits: 0, misses: 0, size: 0 }
        })
      }
    })
  )
)

// Utility hooks for accessing specific data types from cache
export const useCustomerCache = (id: string) => 
  useDataStore((state) => state.cache.customers[`customer:${id}`]?.data)

export const useEventCache = (id: string) => 
  useDataStore((state) => state.cache.events[`event:${id}`]?.data)

export const useBookingCache = (id: string) => 
  useDataStore((state) => state.cache.bookings[`booking:${id}`]?.data)

export const useInventoryCache = (id: string) => 
  useDataStore((state) => state.cache.inventory[`inventory:${id}`]?.data)

export const useAnalyticsCache = (key: string) => 
  useDataStore((state) => state.cache.analytics[`analytics:${key}`]?.data)

// Cache management and statistics hooks
export const useCacheStats = () => useDataStore((state) => state.stats)
export const useOptimisticUpdates = () => useDataStore((state) => state.optimisticUpdates)

// Auto-cleanup expired cache entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    useDataStore.getState().clearExpiredCache()
  }, 5 * 60 * 1000)
} 