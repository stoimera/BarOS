'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'

type UserRole = 'admin' | 'staff' | 'customer' | null

export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const supabase = createClient()
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user role:', profileError)
          setError('Failed to fetch user role')
          setRole(null)
        } else {
          setRole(profile?.role as UserRole || null)
        }
      } catch (err) {
        console.error('Error in useUserRole:', err)
        setError('Failed to fetch user role')
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  return { role, loading, error }
}
