import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { Customer, LoyaltyTier, LoyaltyTierConfig, LoyaltyReward } from '@/types/customer'
import { api } from '@/lib/api/client'

// Fetch customers with pagination and search functionality
export async function fetchCustomers({ search = '', page = 1, limit = 10 }: { search?: string; page?: number; limit?: number }) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const { data } = await api.get<{ data: Customer[]; count: number }>(`/api/customers?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
}

// Fetch single customer by ID
export async function fetchCustomerById(id: string): Promise<Customer> {
  try {
    const { data } = await api.get<Customer>(`/api/customers/${id}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch customer by ID:', error);
    throw error;
  }
}

// Create new customer record
export async function insertCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data } = await api.post<Customer>('/api/customers', customer)
    return data
  } catch (error) {
    console.error('Failed to create customer:', error)
    throw error
  }
}

// Update existing customer record
export async function updateCustomer(id: string, updates: Partial<Customer>) {
  try {
    const { data } = await api.put<Customer>(`/api/customers/${id}`, { id, ...updates });
    return data;
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw error;
  }
}

// Delete customer record
export async function deleteCustomer(id: string) {
  try {
    await api.delete(`/api/customers/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw error;
  }
}

// Get customer statistics for dashboard
export async function getCustomerStats() {
  const supabase = await createServiceRoleClient()
  const { count: total_customers, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
  
  if (error) throw error
  
  return {
    total_customers: total_customers || 0
  }
}

// Fetch customers with additional calculated fields and placeholders
export async function fetchCustomersWithDetails({ 
  search = '', 
  page = 1, 
  limit = 10 
}: { 
  search?: string
  page?: number
  limit?: number 
}) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const { data } = await api.get<{ data: Customer[]; count: number }>(`/api/customers?${params.toString()}`);
    
    // Transform data to include calculated fields - use actual visit counts
    const customersWithDetails = (data.data as any[]).map(customer => ({
      ...customer,
      total_visits: customer.calculated_visits || customer.total_visits || 0, // Use calculated visits from API
      last_visit: customer.last_visit_date || null, // Use actual value from database
      visits: [] // Placeholder for detailed visits array
    }))
    
    return { data: customersWithDetails, count: data.count }
  } catch (error) {
    console.error('Failed to fetch customers with details:', error);
    throw error;
  }
}

// Fetch customers with loyalty data from database joins
export async function fetchCustomersWithLoyalty({ 
  search = '', 
  page = 1, 
  limit = 10 
}: { 
  search?: string
  page?: number
  limit?: number 
}) {
  const supabase = await createServiceRoleClient()
  
  // Build base query for customers
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
  
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  
  query = query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)
  const { data: customers, count, error } = await query
  
  if (error) throw error
  
  // For each customer, get their loyalty data if they have a profile
  const customersWithLoyalty = await Promise.all(
    (customers as any[]).map(async (customer) => {
      let loyalty = null
      
      if (customer.profile_id) {
        // Get profile to find user_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', customer.profile_id)
          .single()
        
        if (profile) {
          // Get loyalty data
          const { data: loyaltyData } = await supabase
            .from('loyalty')
            .select('*')
            .eq('user_id', profile.user_id)
            .single()
          
          loyalty = loyaltyData
        }
      }
      
      return {
        ...customer,
        current_punches: loyalty?.punch_count || 0,
        loyalty_goal: loyalty?.goal || 10,
        loyalty_tier: loyalty?.tier || 'bronze',
        total_points: loyalty?.total_points || 0,
        lifetime_visits: loyalty?.lifetime_visits || 0,
        last_visit: loyalty?.last_visit || null,
        rewarded: loyalty?.rewarded || false
      }
    })
  )
  
  return { data: customersWithLoyalty, count }
}

// Loyalty tier configuration for the reward system
export const LOYALTY_TIERS: LoyaltyTierConfig[] = [
  {
    tier: LoyaltyTier.BRONZE,
    name: 'Bronze',
    color: '#cd7f32',
    minVisits: 0,
    pointsPerVisit: 1,
    bonusMultiplier: 1.0,
    rewards: ['10% off first drink', 'Birthday reward'],
    icon: '🥉'
  },
  {
    tier: LoyaltyTier.SILVER,
    name: 'Silver',
    color: '#c0c0c0',
    minVisits: 10,
    pointsPerVisit: 2,
    bonusMultiplier: 1.2,
    rewards: ['15% off drinks', 'Priority booking', 'Free appetizer'],
    icon: '🥈'
  },
  {
    tier: LoyaltyTier.GOLD,
    name: 'Gold',
    color: '#ffd700',
    minVisits: 25,
    pointsPerVisit: 3,
    bonusMultiplier: 1.5,
    rewards: ['20% off drinks', 'VIP event access', 'Free dessert', 'Exclusive events'],
    icon: '🥇'
  },
  {
    tier: LoyaltyTier.PLATINUM,
    name: 'Platinum',
    color: '#e5e4e2',
    minVisits: 50,
    pointsPerVisit: 5,
    bonusMultiplier: 2.0,
    rewards: ['25% off drinks', 'All VIP benefits', 'Personal concierge', 'Exclusive tastings'],
    icon: '💎'
  }
]

export function getTierForVisits(visits: number): LoyaltyTier {
  if (visits >= 50) return LoyaltyTier.PLATINUM
  if (visits >= 25) return LoyaltyTier.GOLD
  if (visits >= 10) return LoyaltyTier.SILVER
  return LoyaltyTier.BRONZE
}

export function getTierConfig(tier: LoyaltyTier): LoyaltyTierConfig {
  return LOYALTY_TIERS.find(t => t.tier === tier) || LOYALTY_TIERS[0]
}

export function calculatePoints(visits: number, tier: LoyaltyTier): number {
  const config = getTierConfig(tier)
  return visits * config.pointsPerVisit
}

// Enhanced loyalty management
export async function addCustomerVisit(customerId: string, notes?: string): Promise<void> {
  
  const supabase = await createServiceRoleClient()
  
  // Add visit record directly using customer_id
  const { error: visitError } = await supabase
    .from('visits')
    .insert({
      customer_id: customerId,
      visit_date: new Date().toISOString().split('T')[0],
      visit_time: new Date().toTimeString().split(' ')[0],
      notes: notes || 'Visit recorded'
    })

  if (visitError) throw visitError

  // Update loyalty using customer_id directly
  const { data: loyalty, error: loyaltyError } = await supabase
    .from('loyalty')
    .select('*')
    .eq('customer_id', customerId)
    .single()

  if (loyaltyError) throw loyaltyError

  const newLifetimeVisits = loyalty.lifetime_visits + 1
  const newTier = getTierForVisits(newLifetimeVisits)
  const newPoints = calculatePoints(newLifetimeVisits, newTier)
  const newPunchCount = loyalty.punch_count + 1

  const { error: updateError } = await supabase
    .from('loyalty')
    .update({
      punch_count: newPunchCount,
      tier: newTier,
      total_points: newPoints,
      lifetime_visits: newLifetimeVisits,
      last_visit: new Date().toISOString().split('T')[0],
      rewarded: newPunchCount >= loyalty.goal ? false : loyalty.rewarded
    })
    .eq('customer_id', customerId)

  if (updateError) throw updateError

  // Check if tier upgrade occurred
  if (newTier !== loyalty.tier) {
    await generateTierUpgradeReward(customerId, newTier)
  }

  // Check if punch card is complete
  if (newPunchCount >= loyalty.goal && !loyalty.rewarded) {
    await generatePunchCardReward(customerId, loyalty.goal)
  }
}

export async function markLoyaltyRewarded(customerId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { error: updateError } = await supabase
    .from('loyalty')
    .update({
      rewarded: true,
      punch_count: 0 // Reset punch card
    })
    .eq('customer_id', customerId)

  if (updateError) throw updateError
}

export async function generateTierUpgradeReward(customerId: string, tier: LoyaltyTier): Promise<void> {
  const supabase = await createServiceRoleClient()
  
  // First get the loyalty record to get the loyalty_id
  const { data: loyalty, error: loyaltyError } = await supabase
    .from('loyalty')
    .select('id')
    .eq('customer_id', customerId)
    .single()

  if (loyaltyError) throw loyaltyError

  const config = getTierConfig(tier)
  const rewardDescription = `Welcome to ${config.name} tier! You've unlocked: ${config.rewards.join(', ')}`

  const { error } = await supabase
    .from('loyalty_rewards')
    .insert({
      loyalty_id: loyalty.id,
      tier: tier,
      reward_type: 'custom',
      description: rewardDescription,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    })

  if (error) throw error
}

export async function generatePunchCardReward(customerId: string, goal: number): Promise<void> {
  const supabase = await createServiceRoleClient()
  
  // First get the loyalty record to get the loyalty_id
  const { data: loyalty, error: loyaltyError } = await supabase
    .from('loyalty')
    .select('id')
    .eq('customer_id', customerId)
    .single()

  if (loyaltyError) throw loyaltyError

  const rewardDescription = `Congratulations! You've completed your ${goal}-visit punch card. Claim your reward!`

  const { error } = await supabase
    .from('loyalty_rewards')
    .insert({
      loyalty_id: loyalty.id,
      tier: 'bronze', // Default tier for punch card rewards
      reward_type: 'free_drink',
      description: rewardDescription,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })

  if (error) throw error
}

export async function getCustomerLoyaltyRewards(customerId: string): Promise<LoyaltyReward[]> {
  
  const supabase = await createServiceRoleClient()
  
  // First get the loyalty record to get the loyalty_id
  const { data: loyalty, error: loyaltyError } = await supabase
    .from('loyalty')
    .select('id')
    .eq('customer_id', customerId)
    .single()

  if (loyaltyError) {
    console.warn('getCustomerLoyaltyRewards: No loyalty record found for customer:', loyaltyError);
    return [];
  }

  // Get loyalty rewards for the loyalty_id
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('loyalty_id', loyalty.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('getCustomerLoyaltyRewards: Error fetching loyalty rewards:', error);
    return [];
  }
  
  return data || []
}

export async function claimLoyaltyReward(rewardId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('loyalty_rewards')
    .update({
      claimed: true,
      claimed_at: new Date().toISOString()
    })
    .eq('id', rewardId)

  if (error) throw error
} 