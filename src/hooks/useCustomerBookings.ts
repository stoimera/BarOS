import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './useAuth'

export function useCustomerBookings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['customer-bookings', user?.id],
    queryFn: async () => {
      if (!user) return []

      const supabase = createClient()
      
      try {
        // Get customer ID from user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          console.error('Profile error:', profileError)
          throw new Error('Profile not found')
        }

        // Try to get customer ID using RLS function first
        const { data: rlsCustomerId, error: rlsError } = await supabase
          .rpc('get_user_customer_id')

        let customerId = rlsCustomerId

        // If RLS function fails, try manual lookup
        if (rlsError || !customerId) {
          console.log('RLS function failed, trying manual lookup...')
          
          // Try to find customer by profile_id
          const { data: customerByProfile, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', profile.id)
            .single()

          if (!customerError && customerByProfile) {
            customerId = customerByProfile.id
          } else if (user.email) {
            // Try to find by email
            const { data: customerByEmail, error: emailError } = await supabase
              .from('customers')
              .select('id')
              .eq('email', user.email)
              .single()
            
            if (!emailError && customerByEmail) {
              customerId = customerByEmail.id
            }
          }
        }

        if (!customerId) {
          throw new Error('Customer not found')
        }

        // Fetch customer's bookings
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', customerId)
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true })

        if (error) {
          console.error('Bookings fetch error:', error)
          throw error
        }

        console.log(`Found ${bookings?.length || 0} total bookings for customer ${customerId}`)
        return bookings || []
      } catch (error) {
        console.error('Error in useCustomerBookings:', error)
        throw error
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  })
}

export function useCustomerUpcomingBookings(showPastBookings = false) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['customer-upcoming-bookings', user?.id, showPastBookings],
    queryFn: async () => {
      if (!user) {
        console.log('No user, returning empty array')
        return []
      }

      console.log('Starting customer upcoming bookings query for user:', user.id, 'showPastBookings:', showPastBookings)
      const supabase = createClient()
      
      try {
        // Get customer ID from user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          console.error('Profile error:', profileError)
          throw new Error('Profile not found')
        }

        console.log('Found profile:', profile.id)

        // Try to get customer ID using RLS function first
        const { data: rlsCustomerId, error: rlsError } = await supabase
          .rpc('get_user_customer_id')

        let customerId = rlsCustomerId

        // If RLS function fails, try manual lookup
        if (rlsError || !customerId) {
          console.log('RLS function failed, trying manual lookup...', rlsError)
          
          // Try to find customer by profile_id
          const { data: customerByProfile, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', profile.id)
            .single()

          if (!customerError && customerByProfile) {
            customerId = customerByProfile.id
            console.log('Found customer by profile_id:', customerId)
          } else if (user.email) {
            // Try to find by email
            const { data: customerByEmail, error: emailError } = await supabase
              .from('customers')
              .select('id')
              .eq('email', user.email)
              .single()
            
            if (!emailError && customerByEmail) {
              customerId = customerByEmail.id
              console.log('Found customer by email:', customerId)
            }
          }
        } else {
          console.log('Found customer via RLS function:', customerId)
        }

        if (!customerId) {
          throw new Error('Customer not found')
        }

        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        console.log('Fetching bookings for customer:', customerId, 'from date:', todayStr, 'showPastBookings:', showPastBookings)

        let query = supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', customerId)

        if (showPastBookings) {
          // If showing past bookings, fetch all bookings
          query = query.order('booking_date', { ascending: true })
        } else {
          // If NOT showing past bookings, only fetch future/current bookings
          query = query.gte('booking_date', todayStr)
          query = query.order('booking_date', { ascending: true })
        }

        query = query.order('start_time', { ascending: true })

        const { data: bookings, error } = await query

        if (error) {
          console.error('Bookings fetch error:', error)
          throw error
        }

        // Apply additional filtering based on showPastBookings preference
        let filteredBookings = bookings || []

        if (!showPastBookings) {
          // Filter out past bookings when showPastBookings is false
          filteredBookings = filteredBookings.filter(booking => {
            const bookingDate = new Date(booking.booking_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            // Only show bookings that are today or in the future
            return bookingDate >= today
          })
        }

        console.log(`Found ${filteredBookings.length} ${showPastBookings ? 'total' : 'upcoming'} bookings for customer ${customerId}`)
        console.log('Filtered bookings:', filteredBookings)
        return filteredBookings
      } catch (error) {
        console.error('Error in useCustomerUpcomingBookings:', error)
        throw error
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  })
}
