import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// UI state interface for global UI management
interface UIState {
  // Theme state for light/dark mode
  theme: 'light' | 'dark' | 'system'
  
  // Sidebar collapsed state for navigation
  sidebarCollapsed: boolean
  
  // Active modals for modal management
  activeModals: Set<string>
  
  // Notifications for toast messages
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    timestamp: number
  }>
  
  // Loading states for UI feedback
  globalLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Search and filters for data tables
  searchQuery: string
  activeFilters: Record<string, any>
  
  // Pagination state for data tables
  currentPage: number
  pageSize: number

  // Modal states for CRUD operations
  addCustomerModalOpen: boolean
  addBookingModalOpen: boolean
  addEventModalOpen: boolean
  addInventoryModalOpen: boolean
}

// UI actions interface for state mutations
interface UIActions {
  // Theme management actions
  setTheme: (theme: UIState['theme']) => void
  toggleTheme: () => void
  
  // Sidebar management actions
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  
  // Modal management actions
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  closeAllModals: () => void
  isModalOpen: (modalId: string) => boolean
  
  // Notification management actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Loading state management actions
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingStates: () => void
  
  // Search and filter management actions
  setSearchQuery: (query: string) => void
  setFilter: (key: string, value: any) => void
  clearFilters: () => void
  clearSearch: () => void
  
  // Pagination management actions
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  resetPagination: () => void

  // CRUD modal management actions
  openAddCustomerModal: () => void
  closeAddCustomerModal: () => void

  openAddBookingModal: () => void
  closeAddBookingModal: () => void

  openAddEventModal: () => void
  closeAddEventModal: () => void

  openAddInventoryModal: () => void
  closeAddInventoryModal: () => void
}

type UIStore = UIState & UIActions

// UI store with persistence for theme and sidebar state
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      sidebarCollapsed: false,
      activeModals: new Set(),
      notifications: [],
      globalLoading: false,
      loadingStates: {},
      searchQuery: '',
      activeFilters: {},
      currentPage: 1,
      pageSize: 10,
      addCustomerModalOpen: false,
      addBookingModalOpen: false,
      addEventModalOpen: false,
      addInventoryModalOpen: false,

      // Theme actions
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },

      // Sidebar actions
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
        localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
      },

      toggleSidebar: () => {
        const { sidebarCollapsed } = get()
        get().setSidebarCollapsed(!sidebarCollapsed)
      },

      // Modal actions
      openModal: (modalId) => {
        set((state) => ({
          activeModals: new Set([...state.activeModals, modalId])
        }))
      },

      closeModal: (modalId) => {
        set((state) => {
          const newModals = new Set(state.activeModals)
          newModals.delete(modalId)
          return { activeModals: newModals }
        })
      },

      closeAllModals: () => {
        set({ activeModals: new Set() })
      },

      isModalOpen: (modalId) => {
        return get().activeModals.has(modalId)
      },

      // Notification actions
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now()
        }
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))

        // Auto-remove notification after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration || 5000)
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      // Loading actions
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading })
      },

      setLoadingState: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }))
      },

      clearLoadingStates: () => {
        set({ loadingStates: {} })
      },

      // Search and filter actions
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      setFilter: (key, value) => {
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [key]: value
          }
        }))
      },

      clearFilters: () => {
        set({ activeFilters: {} })
      },

      clearSearch: () => {
        set({ searchQuery: '' })
      },

      // Pagination actions
      setCurrentPage: (page) => {
        set({ currentPage: page })
      },

      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 })
      },

      resetPagination: () => {
        set({ currentPage: 1, pageSize: 10 })
      },

      openAddCustomerModal: () => set({ addCustomerModalOpen: true }),
      closeAddCustomerModal: () => set({ addCustomerModalOpen: false }),

      openAddBookingModal: () => set({ addBookingModalOpen: true }),
      closeAddBookingModal: () => set({ addBookingModalOpen: false }),

      openAddEventModal: () => set({ addEventModalOpen: true }),
      closeAddEventModal: () => set({ addEventModalOpen: false }),

      openAddInventoryModal: () => set({ addInventoryModalOpen: true }),
      closeAddInventoryModal: () => set({ addInventoryModalOpen: false }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        pageSize: state.pageSize
      })
    }
  )
)

// Selectors for better performance
export const useTheme = () => useUIStore((state) => state.theme)
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed)
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading)
export const useNotifications = () => useUIStore((state) => state.notifications)
export const useSearchQuery = () => useUIStore((state) => state.searchQuery)
export const useActiveFilters = () => useUIStore((state) => state.activeFilters)
export const usePagination = () => useUIStore((state) => ({ 
  currentPage: state.currentPage, 
  pageSize: state.pageSize 
}))

// Utility hooks
export const useLoadingState = (key: string) => 
  useUIStore((state) => state.loadingStates[key] || false)

export const useModalState = (modalId: string) => 
  useUIStore((state) => state.activeModals.has(modalId)) 