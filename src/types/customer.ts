import { UserRole } from './common'

// Profile interface for authenticated users
export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  birthday?: Date
  tags: string[]
  notes?: string
  avatar_url?: string
  preferences: Record<string, any>
  created_at: Date
  updated_at: Date
}

// Customer interface for non-authenticated customers
export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  birthday?: Date
  tags: string[]
  notes?: string
  profile_id?: string
  created_at: Date
  updated_at: Date
}

// Enhanced loyalty program interface
export interface Loyalty {
  id: string
  user_id: string
  punch_count: number
  goal: number
  tier: LoyaltyTier
  total_points: number
  lifetime_visits: number
  last_visit?: Date
  rewarded: boolean
  // Separate punch cards for different visit types
  coffee_punch_count: number
  coffee_goal: number
  coffee_rewarded: boolean
  alcohol_punch_count: number
  alcohol_goal: number
  alcohol_rewarded: boolean
  created_at: Date
  updated_at: Date
}

// Loyalty tier system
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

// Loyalty tier configuration
export interface LoyaltyTierConfig {
  tier: LoyaltyTier
  name: string
  color: string
  minVisits: number
  pointsPerVisit: number
  bonusMultiplier: number
  rewards: string[]
  icon: string
}

// Loyalty reward interface
export interface LoyaltyReward {
  id: string
  user_id: string
  tier: LoyaltyTier
  reward_type: RewardType
  description: string
  claimed: boolean
  claimed_at?: Date
  expires_at?: Date
  created_at: Date
}

// Reward types
export enum RewardType {
  FREE_DRINK = 'free_drink',
  DISCOUNT = 'discount',
  PRIORITY_BOOKING = 'priority_booking',
  VIP_EVENT_ACCESS = 'vip_event_access',
  BIRTHDAY_REWARD = 'birthday_reward',
  CUSTOM = 'custom'
}

// Visit tracking interface
export interface Visit {
  id: string
  user_id: string
  date: Date
  notes?: string
  created_at: Date
}

// Customer with extended information
export interface CustomerWithDetails extends Customer {
  loyalty?: Loyalty
  visits: Visit[]
  total_visits: number
  last_visit?: Date
  total_spent?: number
  average_rating?: number
  // Loyalty fields from fetchCustomersWithLoyalty
  lifetime_visits?: number
  loyalty_tier?: string
  current_punches?: number
  loyalty_goal?: number
  total_points?: number
  rewarded?: boolean
}

// Profile with extended information
export interface ProfileWithDetails extends Profile {
  loyalty?: Loyalty
  visits: Visit[]
  total_visits: number
  last_visit?: Date
  role: UserRole
}

// Customer creation/update form data
export interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  birthday?: Date
  tags: string[]
  notes?: string
}

// Profile creation/update form data
export interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  birthday?: Date
  tags: string[]
  notes?: string
  preferences: Record<string, any>
}

// Customer search and filter options
export interface CustomerFilters {
  search?: string
  tags?: string[]
  hasLoyalty?: boolean
  visitedAfter?: Date
  visitedBefore?: Date
  sortBy?: 'name' | 'created_at' | 'last_visit' | 'total_visits'
  sortOrder?: 'asc' | 'desc'
}

// Customer statistics
export interface CustomerStats {
  total_customers: number
  new_customers_this_month: number
  active_customers_this_month: number
  customers_with_loyalty: number
  average_visits_per_customer: number
  top_customers: CustomerWithDetails[]
}

// Loyalty punch card interface
export interface PunchCard {
  current_punches: number
  goal: number
  progress_percentage: number
  is_rewarded: boolean
  next_reward_at: number
}

// Customer import/export interface
export interface CustomerImportData {
  name: string
  email?: string
  phone?: string
  birthday?: string
  tags?: string
  notes?: string
}

export interface CustomerExportData extends Customer {
  loyalty_status: string
  total_visits: number
  last_visit_formatted?: string
  created_at_formatted: string
}

// Customer with loyalty data for forecasting
export interface CustomerWithLoyalty extends Customer {
  current_punches: number
  loyalty_goal: number
  loyalty_tier: string
  total_points: number
  lifetime_visits: number
  last_visit?: Date | null
  rewarded: boolean
}

// Feedback interface
export interface Feedback {
  id: string
  customer_id: string
  booking_id?: string
  event_id?: string
  rating: number
  comment?: string
  google_review_prompted: boolean
  created_at: Date
  updated_at: Date
}

// Feedback form data
export interface FeedbackFormData {
  rating: number
  comment?: string
  google_review_prompted: boolean
  booking_id?: string
  event_id?: string
}

// Referral interface
export interface Referral {
  id: string
  referrer_id: string
  referred_email: string
  referred_user_id?: string
  completed_booking: boolean
  created_at: Date
  updated_at: Date
}

// Referral statistics
export interface ReferralStats {
  total_referrals: number
  completed_referrals: number
  pending_referrals: number
  referral_code: string
  next_reward_at: number
  has_earned_reward: boolean
} 