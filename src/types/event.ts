import { RSVPStatus } from './common'

// Base Event interface matching database schema
export interface Event {
  id: string
  title: string
  description?: string
  event_date: string // Database uses event_date, not date
  start_time?: string
  end_time?: string
  location?: string
  category?: string
  max_capacity?: number // Database uses max_capacity, not capacity
  current_rsvps?: number // Database has this field
  price?: number
  image_url?: string
  is_active?: boolean // Database uses is_active, not status
  created_by?: string
  created_at: string
  updated_at: string
}

// Enhanced Event interface with additional frontend fields
export interface EnhancedEvent extends Event {
  time?: string
  duration?: number // in minutes
  event_type?: 'single' | 'recurring' | 'series'
  is_featured?: boolean
  tags?: string[]
  status?: 'draft' | 'published' | 'cancelled' | 'completed' // Frontend status mapping
}

// Recurring event pattern for series events
export interface RecurringEventPattern {
  id: string
  event_id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // every X days/weeks/months/years
  day_of_week?: number // 0-6 for weekly
  day_of_month?: number // 1-31 for monthly
  start_date: Date
  end_date?: Date
  max_occurrences?: number
  is_active: boolean
  created_at: Date
}

// Event series for grouped recurring events
export interface EventSeries {
  id: string
  name: string
  description: string
  pattern: RecurringEventPattern
  events: Event[]
  total_events: number
  completed_events: number
  total_rsvps: number
  average_attendance: number
  created_by: string
  created_at: Date
}

// Base RSVP interface for event responses
export interface RSVP {
  id: string
  user_id: string
  event_id: string
  status: RSVPStatus
  checked_in: boolean
  created_at: Date
  updated_at: Date
}

// Enhanced RSVP with additional tracking fields
export interface EnhancedRSVP extends RSVP {
  customer_id?: string
  response_date?: Date
  check_in_time?: Date
  check_out_time?: Date
  dietary_restrictions?: string
  special_requests?: string
  source?: 'direct' | 'email' | 'phone' | 'walk_in' | 'referral'
  reminder_sent?: boolean
  reminder_sent_at?: Date
}

// RSVP analytics for event performance tracking
export interface RSVPAnalytics {
  event_id: string
  total_invited: number
  total_confirmed: number
  total_pending: number
  total_cancelled: number
  total_no_shows: number
  attendance_rate: number
  check_in_rate: number
  average_check_in_time: number // minutes after event start
  source_breakdown: {
    direct: number
    email: number
    phone: number
    walk_in: number
    referral: number
  }
  response_time_breakdown: {
    same_day: number
    within_week: number
    within_month: number
    over_month: number
  }
  no_show_reasons: {
    no_reason: number
    sick: number
    emergency: number
    forgot: number
    weather: number
    other: number
  }
}

// Event performance metrics for analytics
export interface EventPerformance {
  event_id: string
  event_title: string
  event_date: string // Database uses string format
  max_capacity: number // Database uses max_capacity
  current_rsvps: number // Database uses current_rsvps
  total_attendees: number
  attendance_rate: number
  revenue: number
  cost: number
  profit: number
  profit_margin: number
  customer_satisfaction: number // 1-5 scale
  social_media_mentions: number
  new_customers_acquired: number
  repeat_customers: number
  average_spend_per_customer: number
  peak_attendance_time: string
  weather_conditions?: string
  competing_events: number
  marketing_channels: {
    email: number
    social_media: number
    word_of_mouth: number
    paid_advertising: number
    partnerships: number
  }
  feedback_summary: {
    positive: number
    neutral: number
    negative: number
    common_themes: string[]
  }
}

// Event optimization suggestions for improvement
export interface EventOptimization {
  event_id: string
  suggestions: {
    type: 'timing' | 'pricing' | 'marketing' | 'capacity' | 'content'
    title: string
    description: string
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
    estimated_improvement: number // percentage
  }[]
  next_best_actions: string[]
  risk_factors: {
    factor: string
    probability: number
    impact: 'low' | 'medium' | 'high'
    mitigation: string
  }[]
}

// Event comparison for analytics
export interface EventComparison {
  event_ids: string[]
  metrics: {
    attendance_rate: number[]
    revenue: number[]
    profit_margin: number[]
    customer_satisfaction: number[]
    new_customer_acquisition: number[]
  }
  insights: string[]
  recommendations: string[]
}

// Event template for creating consistent events
export interface EventTemplate {
  id: string
  name: string
  description: string
  category: string
  default_duration: number
  default_capacity: number
  default_price: number
  suggested_location: string
  recommended_marketing_channels: string[]
  checklist_items: string[]
  recurring_options: {
    frequency: 'weekly' | 'monthly' | 'quarterly'
    best_days: number[]
    best_times: string[]
    seasonal_factors: string[]
  }
  created_by: string
  created_at: Date
}

// Data structure for creating event templates
export interface CreateEventTemplateData {
  name: string
  description: string
  category: string
  default_duration: number
  default_capacity: number
  default_price: number
  suggested_location: string
  recommended_marketing_channels: string[]
  checklist_items: string[]
  recurring_options: {
    frequency: 'weekly' | 'monthly' | 'quarterly'
    best_days: number[]
    best_times: string[]
    seasonal_factors: string[]
  }
}

// Data structure for updating event templates
export type UpdateEventTemplateData = Partial<CreateEventTemplateData>

// Data structure for creating new events
export interface CreateEventData {
  title: string
  description?: string
  event_date: string // Database uses event_date
  start_time?: string
  end_time?: string
  location?: string
  category?: string
  max_capacity?: number // Database uses max_capacity
  price?: number
  event_type?: 'single' | 'recurring' | 'series'
  is_featured?: boolean
  tags?: string[]
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    day_of_week?: number
    day_of_month?: number
    end_date?: string
    max_occurrences?: number
  }
}

// Data structure for updating existing events
export interface UpdateEventData {
  title?: string
  description?: string
  event_date?: string // Database uses event_date
  start_time?: string
  end_time?: string
  location?: string
  category?: string
  max_capacity?: number // Database uses max_capacity
  price?: number
  is_active?: boolean // Database uses is_active
  status?: 'draft' | 'published' | 'cancelled' | 'completed' // Frontend status mapping
  is_featured?: boolean
  tags?: string[]
}

// Event filtering options for search and filtering
export interface EventFilters {
  search?: string
  date_from?: string
  date_to?: string
  event_type?: ('single' | 'recurring' | 'series')[]
  status?: ('draft' | 'published' | 'cancelled' | 'completed')[]
  location?: string
  price_min?: number
  price_max?: number
  max_capacity_min?: number // Database uses max_capacity
  max_capacity_max?: number // Database uses max_capacity
  tags?: string[]
  featured?: boolean
}

// Event with additional details and analytics
export interface EventWithDetails extends Event {
  rsvps: RSVP[]
  total_rsvps: number
  going_count: number
  interested_count: number
  checked_in_count: number
  creator_name: string
  // Enhanced fields (optional)
  rsvp_analytics?: RSVPAnalytics
  performance?: EventPerformance
  optimization?: EventOptimization
  recurring_pattern?: RecurringEventPattern
  series?: EventSeries
  template?: EventTemplate
  // Frontend mapping fields
  date?: string // Mapped from event_date for frontend compatibility
  status?: 'draft' | 'published' | 'cancelled' | 'completed' // Mapped from is_active
  capacity?: number // Mapped from max_capacity for frontend compatibility
}

// RSVP with customer information
export interface RSVPWithCustomer extends RSVP {
  user_name: string
  user_email: string
}

// Event search filters for advanced search
export interface EventSearchFilters {
  search?: string
  date_from?: string
  date_to?: string
  location?: string
  status?: 'draft' | 'published' | 'cancelled'
  sortBy?: 'event_date' | 'title' | 'created_at' | 'current_rsvps' // Database column names
  sortOrder?: 'asc' | 'desc'
}

// Event statistics for dashboard
export interface EventStats {
  total_events: number
  upcoming_events: number
  past_events: number
  total_rsvps: number
  average_attendance: number
}

// Event form data for creating/editing events
export interface EventFormData {
  title: string
  description?: string
  date: Date | string // Form uses 'date' instead of 'event_date'
  start_time: string // Required start time (HH:MM format)
  end_time?: string // Optional end time (HH:MM format)
  location?: string
  category?: string
  capacity?: number // Form uses 'capacity' instead of 'max_capacity'
  price?: number
  image_url?: string
}

// Event reminder for notifications
export interface EventReminder {
  id: string
  event_id: string
  user_id: string
  reminder_type: 'email' | 'sms' | 'push'
  reminder_time: Date
  sent: boolean
  sent_at?: Date
}

// Event notification for user alerts
export interface EventNotification {
  id: string
  event_id: string
  user_id: string
  type: 'reminder' | 'update' | 'cancellation'
  title: string
  message: string
  read: boolean
  created_at: Date
  sent_at?: Date
}

// Event import/export data structure
export interface EventImportExport {
  events: Event[]
  templates: EventTemplate[]
  metadata: {
    export_date: Date
    version: string
    total_events: number
    total_templates: number
  }
}

// Event type classification
export type EventType = 'booking' | 'bar_event' | 'other';

// Calendar event for display in calendar components
export type CalendarEvent = {
  id: string; 
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; 
  datetime: string; 
  created_by: string;
  type: EventType;
  created_at: string;
  updated_at: string;
  related_booking_id?: string;
}; 