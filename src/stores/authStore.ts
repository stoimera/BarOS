import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

// Authentication state interface
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  userRole: 'admin' | 'staff' | 'customer' | null
  profile: {
    first_name?: string
    last_name?: string
    avatar_url?: string
  } | null
}

// Authentication actions interface
interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setProfile: (profile: AuthState['profile']) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

// Initialize Supabase client
const supabase = createClient()

// Create authentication store with persistence
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial authentication state
      user: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      userRole: null,
      profile: null,

      // Update user and authentication state
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          userRole: user?.user_metadata?.role || null,
          loading: false,
          error: null
        })
      },

      // Update loading state
      setLoading: (loading) => {
        set({ loading })
      },

      // Set error state and clear loading
      setError: (error) => {
        set({ error, loading: false })
      },

      // Update user profile information
      setProfile: (profile) => {
        set({ profile })
      },

      // Sign out user and clear authentication state
      logout: async () => {
        try {
          set({ loading: true })
          await supabase.auth.signOut()
          set({
            user: null,
            isAuthenticated: false,
            userRole: null,
            profile: null,
            loading: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            loading: false
          })
        }
      },

      // Refresh user data from Supabase
      refreshUser: async () => {
        try {
          set({ loading: true })
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) throw error
          
          if (user) {
            // Fetch user profile data from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', user.id)
              .single()

            set({
              user,
              isAuthenticated: true,
              userRole: user.user_metadata?.role || null,
              profile: profile || null,
              loading: false,
              error: null
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              userRole: null,
              profile: null,
              loading: false,
              error: null
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh user',
            loading: false
          })
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        profile: state.profile
      })
    }
  )
)

// Selector hooks for accessing specific auth state
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useUserRole = () => useAuthStore((state) => state.userRole)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useProfile = () => useAuthStore((state) => state.profile) 