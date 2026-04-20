import { supabase } from './supabase'
import { Feedback, FeedbackFormData } from '@/types/customer'

// Helper function to get customer ID from user ID
async function getCustomerIdFromUserId(userId: string): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // First, get the profile_id from the profiles table using user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error finding profile:', profileError)
      throw new Error('Profile not found')
    }

    const profileId = profile.id

    // Try to find customer by profile_id
    const { data: customerByProfile, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('profile_id', profileId)
      .single()

    if (!customerError && customerByProfile) {
      return customerByProfile.id
    }

    // If not found by profile_id, try to find by email
    if (user.email) {
      const { data: customerByEmail, error: emailError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single()
      
      if (!emailError && customerByEmail) {
        return customerByEmail.id
      }
    }

    // If customer doesn't exist, create one
    const customerName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Customer'
    
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        profile_id: profileId,
        name: customerName,
        email: user.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating customer:', createError)
      throw new Error(`Failed to create customer record: ${createError.message}`)
    }

    if (!newCustomer) {
      throw new Error('Failed to create customer record: No data returned')
    }

    return newCustomer.id
  } catch (error) {
    console.error('Error in getCustomerIdFromUserId:', error)
    throw error
  }
}

export async function submitFeedback(feedbackData: FeedbackFormData): Promise<Feedback> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the customer ID for this user
    const customerId = await getCustomerIdFromUserId(user.id)

    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        customer_id: customerId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        google_review_prompted: feedbackData.google_review_prompted,
        booking_id: feedbackData.booking_id,
        event_id: feedbackData.event_id
      }])
      .select()
      .single()

    if (error) throw error
    return data as Feedback
  } catch (error) {
    console.error('Error submitting feedback:', error)
    throw error
  }
}

export async function getCustomerFeedback(userId: string): Promise<Feedback[]> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
  
      return []
    }

    // Get the customer ID for this user
    const customerId = await getCustomerIdFromUserId(userId)

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error getting customer feedback:', error)
      return []
    }
    
    return data as Feedback[]
  } catch (error) {
    console.error('Error getting customer feedback:', error)
    // Return empty array if customer doesn't exist or other error
    return []
  }
}

export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Feedback[]
  } catch (error) {
    console.error('Error getting all feedback:', error)
    return []
  }
}

export async function getFeedbackStats() {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating')

    if (error) throw error

    const ratings = data as { rating: number }[]
    const total = ratings.length
    const average = total > 0 ? ratings.reduce((sum, item) => sum + item.rating, 0) / total : 0
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratings.filter(item => item.rating === rating).length
    }))

    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution
    }
  } catch (error) {
    console.error('Error getting feedback stats:', error)
    return {
      total: 0,
      average: 0,
      distribution: [1, 2, 3, 4, 5].map(rating => ({ rating, count: 0 }))
    }
  }
} 