// Enhanced Reward System Types

export enum RewardCategory {
  BIRTHDAY = 'birthday',
  LOYALTY_PUNCH_CARD = 'loyalty_punch_card',
  FREE_COFFEE = 'free_coffee',
  FREE_ALCOHOLIC_DRINK = 'free_alcoholic_drink',
  DISCOUNT = 'discount',
  VIP_ACCESS = 'vip_access',
  REFERRAL = 'referral',
  MILESTONE = 'milestone',
  CUSTOM = 'custom'
}

export enum RewardStatus {
  ACTIVE = 'active',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface EnhancedReward {
  id: string;
  customer_id: string;
  category: RewardCategory;
  description: string;
  value: number;
  requires_age_verification: boolean;
  min_age?: number;
  redemption_code: string;
  /** Set for punch-card QR vouchers; staff redeem resets the matching punch line */
  punch_kind?: 'coffee' | 'alcohol' | null;
  status: RewardStatus;
  claimed: boolean;
  claimed_at?: Date;
  claimed_by_staff_id?: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RewardWithDetails extends EnhancedReward {
  customer: {
    id: string;
    name: string;
    email: string;
    date_of_birth?: Date;
  };
  staff?: {
    id: string;
    position: string;
  };
}

// Reward creation data
export interface CreateRewardData {
  customer_id: string;
  category: RewardCategory;
  description: string;
  value: number;
  requires_age_verification?: boolean;
  min_age?: number;
  expires_at: Date;
}

// Reward redemption data
export interface RedeemRewardData {
  reward_id: string;
  staff_id: string;
  customer_age_verified?: boolean;
  notes?: string;
}

// Reward filters
export interface RewardFilters {
  customer_id?: string;
  category?: RewardCategory;
  status?: RewardStatus;
  requires_age_verification?: boolean;
  date_from?: string;
  date_to?: string;
  claimed?: boolean;
}

// Reward analytics
export interface RewardAnalytics {
  total_rewards: number;
  claimed_rewards: number;
  expired_rewards: number;
  claim_rate: number;
  average_value: number;
  rewards_by_category: { category: RewardCategory; count: number; value: number }[];
  rewards_by_month: { month: string; count: number; value: number }[];
}

// Age verification interface
export interface AgeVerification {
  customer_id: string;
  verified_by_staff_id: string;
  verification_method: 'id_check' | 'self_declaration' | 'manager_override';
  verified_at: Date;
  notes?: string;
}

// Reward template for different categories
export interface RewardTemplate {
  category: RewardCategory;
  name: string;
  description: string;
  default_value: number;
  requires_age_verification: boolean;
  min_age?: number;
  validity_days: number;
  max_uses_per_customer?: number;
  conditions?: string[];
}

// Reward templates configuration
export const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    category: RewardCategory.BIRTHDAY,
    name: 'Birthday Reward',
    description: 'Free drink on your birthday!',
    default_value: 15,
    requires_age_verification: true,
    min_age: 21,
    validity_days: 30,
    max_uses_per_customer: 1,
    conditions: ['Valid ID required for alcoholic drinks']
  },
  {
    category: RewardCategory.LOYALTY_PUNCH_CARD,
    name: 'Punch Card Reward',
    description: 'Complete your punch card to earn a free drink!',
    default_value: 12,
    requires_age_verification: false,
    validity_days: 60,
    conditions: ['Must complete 10 visits']
  },
  {
    category: RewardCategory.FREE_COFFEE,
    name: 'Free Coffee',
    description: 'Enjoy a free coffee of your choice',
    default_value: 5,
    requires_age_verification: false,
    validity_days: 30,
    conditions: ['Valid for any coffee drink']
  },
  {
    category: RewardCategory.FREE_ALCOHOLIC_DRINK,
    name: 'Free Alcoholic Drink',
    description: 'Free alcoholic drink of your choice',
    default_value: 15,
    requires_age_verification: true,
    min_age: 21,
    validity_days: 30,
    conditions: ['Valid ID required', 'Must be 21 or older']
  },
  {
    category: RewardCategory.DISCOUNT,
    name: 'Percentage Discount',
    description: 'Percentage discount on your total bill',
    default_value: 20,
    requires_age_verification: false,
    validity_days: 45,
    conditions: ['Valid on food and non-alcoholic drinks only']
  },
  {
    category: RewardCategory.VIP_ACCESS,
    name: 'VIP Event Access',
    description: 'Exclusive access to VIP events',
    default_value: 50,
    requires_age_verification: true,
    min_age: 21,
    validity_days: 90,
    conditions: ['Valid ID required', 'Subject to event availability']
  },
  {
    category: RewardCategory.REFERRAL,
    name: 'Referral Reward',
    description: 'Reward for referring friends',
    default_value: 10,
    requires_age_verification: false,
    validity_days: 30,
    conditions: ['Must refer 3 friends who complete bookings']
  },
  {
    category: RewardCategory.MILESTONE,
    name: 'Visit Milestone',
    description: 'Reward for reaching visit milestones',
    default_value: 25,
    requires_age_verification: false,
    validity_days: 60,
    conditions: ['Automatic reward for milestone achievements']
  }
];

// Reward generation rules
export interface RewardGenerationRule {
  id: string;
  name: string;
  trigger_type: 'visit_count' | 'birthday' | 'referral' | 'spending' | 'custom';
  trigger_condition: any;
  reward_template: RewardCategory;
  active: boolean;
  created_at: Date;
}

// Reward notification interface
export interface RewardNotification {
  id: string;
  customer_id: string;
  reward_id: string;
  notification_type: 'reward_earned' | 'reward_expiring' | 'reward_claimed';
  message: string;
  sent: boolean;
  sent_at?: Date;
  created_at: Date;
} 