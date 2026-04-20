// Export all stores
export * from './authStore'
export * from './uiStore'
export * from './dataStore'

// Store initialization and utilities
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'
import { useDataStore } from './dataStore'

// Initialize stores on app startup
export const initializeStores = () => {
  // Initialize auth store
  const authStore = useAuthStore.getState()
  
  // Initialize UI store with theme
  const uiStore = useUIStore.getState()
  if (typeof window !== 'undefined') {
    // Apply theme on client side
    uiStore.setTheme(uiStore.theme)
  }
  
  // Initialize data store cleanup
  const dataStore = useDataStore.getState()
  
  return {
    auth: authStore,
    ui: uiStore,
    data: dataStore
  }
}

// Store reset utilities
export const resetAllStores = () => {
  useAuthStore.getState().logout()
  useUIStore.getState().closeAllModals()
  useUIStore.getState().clearNotifications()
  useDataStore.getState().clearAllCache()
}

// Store hydration utilities
export const hydrateStores = () => {
  // This can be used to hydrate stores from server-side data
  // For example, pre-fetching user data or initial state
}

// Store persistence utilities
export const persistStores = () => {
  // Additional persistence logic if needed
  // Currently handled by Zustand persist middleware
}

// Store debugging utilities (development only)
export const debugStores = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth Store:', useAuthStore.getState())
    console.log('UI Store:', useUIStore.getState())
    console.log('Data Store Stats:', useDataStore.getState().getCacheStats())
  }
}

// Store subscription utilities
export const subscribeToStoreChanges = () => {
  // Subscribe to auth changes
  useAuthStore.subscribe((state) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state changed:', state.user ? 'Logged in' : 'Logged out')
    }
  })
  
  // Subscribe to UI changes
  useUIStore.subscribe((state) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Theme changed:', state.theme)
    }
  })
  
  // Subscribe to cache changes
  useDataStore.subscribe((state) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache stats updated:', state.stats)
    }
  })
} 