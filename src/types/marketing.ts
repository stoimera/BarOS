// Marketing campaign types
export interface MarketingCampaign {
  id: string
  name: string
  description?: string
  campaign_type: 'email' | 'social' | 'sms' | 'promotion'
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date?: string
  end_date?: string
  budget?: number
  created_by?: string
  created_at: string
  updated_at: string
}

// Campaign template types
export interface CampaignTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: string[] // Available template variables
  category: 'welcome' | 'promotional' | 'reminder' | 'newsletter' | 'custom'
  is_active: boolean
  created_by: string
  created_at: Date
}

// Customer segment types
export interface CustomerSegment {
  id: string
  name: string
  description: string
  criteria: SegmentCriteria
  customer_count: number
  is_active: boolean
  created_by: string
  created_at: Date
}

export interface SegmentCriteria {
  min_visits?: number
  max_visits?: number
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  last_visit_days?: number
  has_email?: boolean
  location?: string
  age_range?: {
    min: number
    max: number
  }
  spending_range?: {
    min: number
    max: number
  }
}

// Campaign analytics types
export interface CampaignAnalytics {
  campaign_id: string
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
  total_sent: number
  open_rate: number
  click_rate: number
  created_at: string
}

// Automation workflow types
export interface AutomationWorkflow {
  id: string
  name: string
  description: string
  trigger_type: 'customer_signup' | 'booking_created' | 'event_rsvp' | 'loyalty_tier_change' | 'custom'
  trigger_conditions: TriggerConditions
  actions: WorkflowAction[]
  is_active: boolean
  created_by: string
  created_at: Date
}

export interface TriggerConditions {
  loyalty_tier?: string
  event_type?: string
  booking_value?: number
  customer_age?: number
  location?: string
}

export interface WorkflowAction {
  type: 'send_email' | 'update_loyalty' | 'create_booking_reminder' | 'send_sms' | 'create_task'
  subject?: string
  content?: string
  points?: number
  delay_minutes?: number
  template_id?: string
}

// Campaign scheduling types
export interface CampaignSchedule {
  campaign_id: string
  schedule_type: 'immediate' | 'delayed' | 'specific_time' | 'recurring'
  delay_minutes?: number
  scheduled_time?: string
  frequency?: 'daily' | 'weekly' | 'monthly'
  time_of_day?: string // HH:MM format
  day_of_week?: number // 0-6 for recurring weekly
  day_of_month?: number // 1-31 for recurring monthly
}

// Email tracking types
export interface EmailTracking {
  id: string
  campaign_id: string
  customer_id: string
  email: string
  sent_at: Date
  opened_at?: Date
  clicked_at?: Date
  unsubscribed_at?: Date
  ip_address?: string
  user_agent?: string
}

// Marketing settings types
export interface MarketingSettings {
  default_from_email: string
  default_from_name: string
  unsubscribe_url: string
  tracking_enabled: boolean
  double_opt_in: boolean
  max_emails_per_day: number
  email_templates: {
    welcome: string
    unsubscribe: string
    footer: string
  }
}

// A/B testing types
export interface ABTest {
  id: string
  name: string
  description: string
  campaign_id: string
  variant_a: {
    subject: string
    content: string
  }
  variant_b: {
    subject: string
    content: string
  }
  test_size: number // Percentage of audience to test
  duration_days: number
  metric: 'open_rate' | 'click_rate' | 'conversion_rate'
  status: 'draft' | 'running' | 'completed' | 'cancelled'
  winner?: 'a' | 'b' | 'none'
  created_at: Date
  started_at?: Date
  completed_at?: Date
}

// Social media integration types
export interface SocialMediaPost {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  content: string
  image_url?: string
  scheduled_at?: Date
  posted_at?: Date
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  engagement?: {
    likes: number
    shares: number
    comments: number
  }
  created_at: Date
}

// Marketing performance types
export interface MarketingPerformance {
  period: {
    start_date: Date
    end_date: Date
  }
  campaigns: {
    total: number
    sent: number
    scheduled: number
    draft: number
  }
  emails: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  rates: {
    delivery_rate: number
    open_rate: number
    click_rate: number
    bounce_rate: number
    unsubscribe_rate: number
  }
  revenue: {
    attributed: number
    conversion_rate: number
    average_order_value: number
  }
}

export interface Newsletter {
  id: string
  name: string
  subject: string
  content: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at?: string
  sent_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PromotionalMaterial {
  id: string
  name: string
  file_url: string
  file_type: string
  file_size: number
  category?: string
  tags?: string[]
  created_at: string
  updated_at: string
  user_id: string
}

export type CreateCampaignData = {
  name: string
  description?: string
  campaign_type: 'email' | 'social' | 'sms' | 'promotion'
  status?: 'draft' | 'active' | 'paused' | 'completed'
  start_date?: string
  end_date?: string
  budget?: number
}

export type UpdateCampaignData = Partial<CreateCampaignData>
export type CreateNewsletterData = Omit<Newsletter, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type CreatePromoMaterialData = Omit<PromotionalMaterial, 'id' | 'created_at' | 'updated_at' | 'user_id'> 