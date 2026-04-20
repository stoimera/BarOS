import { createClient } from '@/utils/supabase/client';
import { 
  EnhancedReward, 
  RewardWithDetails, 
  CreateRewardData, 
  RedeemRewardData, 
  RewardFilters,
  RewardAnalytics,
  AgeVerification,
  RewardCategory,
  RewardStatus,
  REWARD_TEMPLATES
} from '@/types/rewards';
import { api } from '@/lib/api/client';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// =====================================================
// ENHANCED REWARDS CRUD OPERATIONS
// =====================================================

export async function getEnhancedRewards(filters?: RewardFilters): Promise<RewardWithDetails[]> {
  try {
  
    const params = new URLSearchParams();
    
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requires_age_verification !== undefined) params.append('requires_age_verification', filters.requires_age_verification.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.claimed !== undefined) params.append('claimed', filters.claimed.toString());
    
    const { data } = await api.get<{ data: RewardWithDetails[] }>(`/api/rewards?${params.toString()}`);
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch enhanced rewards:', error);
    throw error;
  }
}

export async function getEnhancedRewardById(id: string): Promise<RewardWithDetails | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('enhanced_rewards')
    .select(`
      *,
      customer:customers(id, name, email, date_of_birth),
      staff:staff(id, position)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching enhanced reward:', error);
    throw new Error('Failed to fetch enhanced reward');
  }

  return data;
}

export async function createEnhancedReward(rewardData: CreateRewardData): Promise<EnhancedReward> {
  // Generate unique redemption code
  const redemptionCode = `REWARD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('enhanced_rewards')
    .insert([{
      ...rewardData,
      redemption_code: redemptionCode,
      status: RewardStatus.ACTIVE,
      claimed: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating enhanced reward:', error);
    throw new Error('Failed to create enhanced reward');
  }

  return data;
}

export async function updateEnhancedReward(id: string, updates: Partial<EnhancedReward>): Promise<EnhancedReward> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('enhanced_rewards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating enhanced reward:', error);
    throw new Error('Failed to update enhanced reward');
  }

  return data;
}

export async function deleteEnhancedReward(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('enhanced_rewards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting enhanced reward:', error);
    throw new Error('Failed to delete enhanced reward');
  }
}

// =====================================================
// REWARD REDEMPTION
// =====================================================

// Generate a unique redemption code
const generateRedemptionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function redeemReward(redeemData: RedeemRewardData): Promise<EnhancedReward> {
  // Get the reward details
  const reward = await getEnhancedRewardById(redeemData.reward_id);
  if (!reward) {
    throw new Error('Reward not found');
  }

  if (reward.claimed) {
    throw new Error('Reward already claimed');
  }

  if (reward.status !== RewardStatus.ACTIVE) {
    throw new Error('Reward is not active');
  }

  if (new Date() > new Date(reward.expires_at)) {
    throw new Error('Reward has expired');
  }

  // Check age verification if required
  if (reward.requires_age_verification && !redeemData.customer_age_verified) {
    throw new Error('Age verification required for this reward');
  }

  // Generate redemption code
  const redemptionCode = generateRedemptionCode();

  // Update the reward as claimed with redemption code
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('enhanced_rewards')
    .update({
      claimed: true,
      claimed_at: new Date().toISOString(),
      claimed_by_staff_id: redeemData.staff_id,
      status: RewardStatus.CLAIMED,
      redemption_code: redemptionCode
    })
    .eq('id', redeemData.reward_id)
    .select()
    .single();

  if (error) {
    console.error('Error redeeming reward:', error);
    throw new Error('Failed to redeem reward');
  }

  return data;
}

// =====================================================
// AGE VERIFICATION
// =====================================================

export async function createAgeVerification(verificationData: AgeVerification): Promise<AgeVerification> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('age_verifications')
    .insert([verificationData])
    .select()
    .single();

  if (error) {
    console.error('Error creating age verification:', error);
    throw new Error('Failed to create age verification');
  }

  return data;
}

export async function getCustomerAgeVerifications(customerId: string): Promise<AgeVerification[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('age_verifications')
    .select('*')
    .eq('customer_id', customerId)
    .order('verified_at', { ascending: false });

  if (error) {
    console.error('Error fetching age verifications:', error);
    throw new Error('Failed to fetch age verifications');
  }

  return data || [];
}

export async function isCustomerAgeVerified(customerId: string): Promise<boolean> {
  const verifications = await getCustomerAgeVerifications(customerId);
  return verifications.length > 0;
}

// =====================================================
// REWARD TEMPLATES AND GENERATION
// =====================================================

export function getRewardTemplate(category: RewardCategory) {
  return REWARD_TEMPLATES.find(template => template.category === category);
}

export async function generateRewardFromTemplate(
  customerId: string, 
  category: RewardCategory, 
  customDescription?: string
): Promise<EnhancedReward> {
  const template = getRewardTemplate(category);
  if (!template) {
    throw new Error(`No template found for category: ${category}`);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + template.validity_days);

  const rewardData: CreateRewardData = {
    customer_id: customerId,
    category: template.category,
    description: customDescription || template.description,
    value: template.default_value,
    requires_age_verification: template.requires_age_verification,
    min_age: template.min_age,
    expires_at: expiresAt
  };

  return createEnhancedReward(rewardData);
}

// =====================================================
// REWARD ANALYTICS
// =====================================================

export async function getRewardAnalytics(filters?: RewardFilters): Promise<RewardAnalytics> {
  const rewards = await getEnhancedRewards(filters);
  
  const totalRewards = rewards.length;
  const claimedRewards = rewards.filter(r => r.claimed).length;
  const expiredRewards = rewards.filter(r => new Date(r.expires_at) < new Date() && !r.claimed).length;
  const claimRate = totalRewards > 0 ? (claimedRewards / totalRewards) * 100 : 0;
  const averageValue = totalRewards > 0 ? rewards.reduce((sum, r) => sum + r.value, 0) / totalRewards : 0;

  // Group by category
  const rewardsByCategory = Object.values(RewardCategory).map(category => {
    const categoryRewards = rewards.filter(r => r.category === category);
    return {
      category,
      count: categoryRewards.length,
      value: categoryRewards.reduce((sum, r) => sum + r.value, 0)
    };
  }).filter(item => item.count > 0);

  // Group by month
  const rewardsByMonth = rewards.reduce((acc, reward) => {
    const month = new Date(reward.created_at).toISOString().substr(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, count: 0, value: 0 };
    }
    acc[month].count++;
    acc[month].value += reward.value;
    return acc;
  }, {} as Record<string, { month: string; count: number; value: number }>);

  return {
    total_rewards: totalRewards,
    claimed_rewards: claimedRewards,
    expired_rewards: expiredRewards,
    claim_rate: Math.round(claimRate * 100) / 100,
    average_value: Math.round(averageValue * 100) / 100,
    rewards_by_category: rewardsByCategory,
    rewards_by_month: Object.values(rewardsByMonth)
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// Helper function to get customer ID from user ID
async function getCustomerIdFromUserId(userId: string): Promise<string> {
  try {
    const supabase = getSupabase();
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
      throw new Error('Profile not found - please contact support')
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
      
      // Provide specific error messages based on the error
      if (createError.code === '42501') {
        throw new Error('Permission denied: Unable to create customer record. Please contact support.')
      } else if (createError.code === '23505') {
        throw new Error('Customer already exists with this profile.')
      } else {
        throw new Error(`Failed to create customer record: ${createError.message}`)
      }
    }

    if (!newCustomer) {
      throw new Error('Failed to create customer record: No data returned')
    }

    return newCustomer.id
  } catch (error) {
    console.error('Error in getCustomerIdFromUserId:', error)
    
    // Re-throw with more user-friendly message
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('Failed to get customer information')
    }
  }
}

export async function getCurrentUserRewards(): Promise<RewardWithDetails[]> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
  
      return [];
    }

    // Check if user is a customer (has customer role or no staff/admin role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
  
      return [];
    }

    // If user is staff or admin, they don't have customer rewards
    if (profile.role === 'staff' || profile.role === 'admin') {
  
      return [];
    }

    // Get the customer ID for this user
    const customerId = await getCustomerIdFromUserId(user.id);

    return getEnhancedRewards({ customer_id: customerId });
  } catch (error) {
    console.error('Error getting current user rewards:', error)
    // Return empty array if customer doesn't exist or other error
    return []
  }
}

export async function getActiveRewards(customerId: string): Promise<RewardWithDetails[]> {
  return getEnhancedRewards({ 
    customer_id: customerId, 
    status: RewardStatus.ACTIVE,
    claimed: false 
  });
}

export async function getExpiredRewards(customerId: string): Promise<RewardWithDetails[]> {
  const rewards = await getEnhancedRewards({ customer_id: customerId });
  return rewards.filter(reward => 
    new Date(reward.expires_at) < new Date() && !reward.claimed
  );
}

export async function cleanupExpiredRewards(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('enhanced_rewards')
    .update({ status: RewardStatus.EXPIRED })
    .lt('expires_at', new Date().toISOString())
    .eq('claimed', false)
    .eq('status', RewardStatus.ACTIVE);

  if (error) {
    console.error('Error cleaning up expired rewards:', error);
    throw new Error('Failed to cleanup expired rewards');
  }
} 