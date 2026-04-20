'use client'

import { useCallback, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

// Initialize Supabase client for authentication
const supabase = createClient()

// Extended user interface with profile data
interface UserWithProfile extends User {
  role?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  is_active?: boolean
}

// Authentication hook for managing user state and auth operations
export function useAuth() {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, phone, avatar_url, is_active')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  // Function to update user with profile data
  const updateUserWithProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setUser(null)
      return
    }

    const profile = await fetchUserProfile(user.id)
    if (profile) {
      setUser({
        ...user,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active
      })
    } else {
      setUser(user)
    }
  }, [])

  useEffect(() => {
    // Get initial session on component mount
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.user) {
        await updateUserWithProfile(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          await updateUserWithProfile(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [updateUserWithProfile])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  // Sign out current user
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Send password reset email
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  // Refresh user profile data
  const refreshProfile = async () => {
    if (user) {
      await updateUserWithProfile(user)
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  }
} 