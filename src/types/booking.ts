// Booking interface
export interface Booking {
  id: string
  customer_id: string
  booking_date: string
  start_time: string
  end_time?: string
  party_size: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Legacy fields for backward compatibility
  user_id?: string
  date?: string
  time?: string
}

// Booking with extended information
export interface BookingWithDetails extends Booking {
  user_name: string
  user_email: string
  user_phone?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

// Booking creation/update form data
export interface BookingFormData {
  user_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  date: Date
  time: string
  party_size: number
  notes?: string
}

// Booking search and filter options
export interface BookingFilters {
  search?: string
  date_from?: Date
  date_to?: Date
  status?: ('pending' | 'confirmed' | 'cancelled' | 'completed')[]
  party_size_min?: number
  party_size_max?: number
  time_from?: string
  time_to?: string
  sortBy?: 'date' | 'time' | 'party_size' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

// Booking statistics
export interface BookingStats {
  total_bookings: number
  pending_bookings: number
  confirmed_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  average_party_size: number
  total_guests: number
}

// Booking calendar interface
export interface CalendarBooking {
  id: string
  title: string
  date: Date
  time: string
  party_size: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  customer_name: string
  color?: string
}

// Table availability interface
export interface TableAvailability {
  date: Date
  time_slots: TimeSlot[]
}

export interface TimeSlot {
  time: string
  available_tables: number
  total_tables: number
  bookings: BookingWithDetails[]
}

// Booking confirmation interface
export interface BookingConfirmation {
  booking_id: string
  confirmation_code: string
  qr_code?: string
  sent_to: string
  sent_at: Date
}

// Booking reminder interface
export interface BookingReminder {
  id: string
  booking_id: string
  reminder_type: 'confirmation' | 'day_before' | 'hour_before' | 'custom'
  reminder_date: Date
  message: string
  sent: boolean
  sent_at?: Date
  created_at: Date
}

// Booking template interface
export interface BookingTemplate {
  id: string
  name: string
  party_size: number
  time: string
  notes_template: string
  created_by: string
  created_at: Date
}

// Booking import/export interface
export interface BookingImportData {
  customer_name: string
  customer_email?: string
  customer_phone?: string
  date: string
  time: string
  party_size: number
  notes?: string
}

export interface BookingExportData extends Booking {
  customer_name: string
  customer_email?: string
  customer_phone?: string
  date_formatted: string
  time_formatted: string
  status_formatted: string
  created_at_formatted: string
}

// Booking notification interface
export interface BookingNotification {
  booking_id: string
  type: 'confirmation' | 'reminder' | 'update' | 'cancellation'
  message: string
  recipient: string
  sent_at?: Date
}

// Recurring booking interface
export interface RecurringBooking {
  id: string
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  day_of_week: number // 0-6 (Sunday-Saturday)
  time: string
  party_size: number
  start_date: Date
  end_date?: Date
  frequency: 'weekly' | 'bi-weekly' | 'monthly'
  is_active: boolean
  notes?: string
  created_at: Date
  updated_at: Date
}

// Booking settings interface
export interface BookingSettings {
  max_party_size: number
  min_advance_notice_hours: number
  max_advance_booking_days: number
  auto_confirm: boolean
  require_confirmation: boolean
  allow_walk_ins: boolean
  enable_waitlist: boolean
  waitlist_expiry_hours: number
  enable_reminders: boolean
  reminder_timing: {
    confirmation: boolean
    day_before: boolean
    hour_before: boolean
  }
  business_hours: BusinessHours[]
  table_capacity: number
  max_concurrent_bookings: number
}

export interface BusinessHours {
  day: number // 0-6 (Sunday-Saturday)
  open: string
  close: string
  is_closed: boolean
}

export interface BookingWithCustomer extends Booking {
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
    tags: string[]
    notes?: string
    created_at: Date
    updated_at: Date
  }
}

export interface CreateBookingData {
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  date: Date
  time: string
  party_size: number
  notes?: string
}

export interface UpdateBookingData {
  date?: Date
  time?: string
  party_size?: number
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
}

// Waitlist interface
export interface WaitlistEntry {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  date: Date
  time: string
  party_size: number
  notes?: string
  priority: 'low' | 'medium' | 'high' | 'vip'
  status: 'waiting' | 'notified' | 'booked' | 'expired'
  created_at: Date
  notified_at?: Date
  booked_at?: Date
}

// Booking analytics interface
export interface BookingAnalytics {
  total_bookings: number
  confirmed_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  no_show_rate: number
  average_party_size: number
  total_guests: number
  conversion_rate: number
  peak_hours: { hour: string; bookings: number }[]
  popular_days: { day: string; bookings: number }[]
  revenue_per_booking: number
  total_revenue: number
  waitlist_conversion_rate: number
  recurring_bookings_count: number
} 