import { supabase } from './supabase'
import { Referral, ReferralStats } from '@/types/customer'
import { REFERRAL_CONFIG } from '@/lib/constants'

export function generateReferralCode(userId: string): string {
  // Simple hash-based referral code generation
  const hash = userId.replace(/-/g, '').substring(0, 8).toUpperCase()
  return hash
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)

  if (error) throw error

  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter(r => r.completed_booking).length
  const pendingReferrals = totalReferrals - completedReferrals
  const referralCode = generateReferralCode(userId)
  const nextRewardAt = 3 - completedReferrals
  const hasEarnedReward = completedReferrals >= 3

  return {
    total_referrals: totalReferrals,
    completed_referrals: completedReferrals,
    pending_referrals: pendingReferrals,
    referral_code: referralCode,
    next_reward_at: Math.max(0, nextRewardAt),
    has_earned_reward: hasEarnedReward
  }
}

export async function createReferral(referredEmail: string): Promise<Referral> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('referrals')
    .insert([{
      referrer_id: user.id,
      referred_email: referredEmail.toLowerCase()
    }])
    .select()
    .single()

  if (error) throw error
  return data as Referral
}

export async function getCustomerReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Referral[]
}

export async function getAllReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Referral[]
}

export async function markReferralCompleted(referralId: string): Promise<void> {
  const { error } = await supabase
    .from('referrals')
    .update({ completed_booking: true })
    .eq('id', referralId)

  if (error) throw error
}

export async function processReferralCode(referralCode: string): Promise<string | null> {
  // This is a simplified lookup - in production you might want a more sophisticated approach
  const { data: users, error } = await supabase.auth.admin.listUsers()
  
  if (error) throw error

  const referrer = users.users.find(user => 
    generateReferralCode(user.id) === referralCode.toUpperCase()
  )

  return referrer?.id || null
}

export async function claimReferralReward(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Check if user has earned a reward
  const stats = await getReferralStats(userId)
  if (!stats.has_earned_reward) {
    throw new Error('No reward available to claim')
  }

  // Create a loyalty reward for the referral completion
  const { error } = await supabase
    .from('loyalty_rewards')
    .insert({
      user_id: userId,
      tier: 'bronze', // Default tier for referral rewards
      reward_type: 'custom',
      description: REFERRAL_CONFIG.rewardDescription,
      claimed: false,
      expires_at: new Date(Date.now() + REFERRAL_CONFIG.rewardExpiryDays * 24 * 60 * 60 * 1000).toISOString()
    })

  if (error) throw error

  // Reset referral count (optional - you might want to keep tracking)
  // This would require updating the referral tracking logic
}

export async function checkReferralRewardEligibility(userId: string): Promise<{
  eligible: boolean
  completedReferrals: number
  neededReferrals: number
  rewardDescription: string
}> {
  const stats = await getReferralStats(userId)
  
  return {
    eligible: stats.has_earned_reward,
    completedReferrals: stats.completed_referrals,
    neededReferrals: REFERRAL_CONFIG.referralsNeededForReward,
    rewardDescription: REFERRAL_CONFIG.rewardDescription
  }
}

export async function getReferralRewards(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('reward_type', 'custom')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
} 