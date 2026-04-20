// Visit Tracking Types

export interface Visit {
  id: string;
  customer_id: string;
  staff_id?: string;
  visit_date: Date;
  visit_type: VisitType;
  notes?: string;
  loyalty_points_earned: number;
  rewards_triggered: string[];
  check_in_time?: Date;
  check_out_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export type VisitType = 'regular' | 'event' | 'special' | 'birthday' | 'vip' | 'alcoholic' | 'non_alcoholic';

export interface VisitQRCode {
  id: string;
  customer_id: string;
  visit_type: VisitType;
  expires_at: Date;
  used: boolean;
  used_at?: Date;
  created_at: Date;
}

export interface VisitStats {
  total_visits: number;
  visits_this_month: number;
  visits_this_week: number;
  average_visits_per_month: number;
  last_visit_date?: Date;
  favorite_visit_day?: string;
  favorite_visit_time?: string;
}

export interface VisitAnalytics {
  visits_by_day: { date: string; count: number }[];
  visits_by_hour: { hour: number; count: number }[];
  visits_by_type: { type: VisitType; count: number }[];
  top_staff_checkins: { staff_id: string; staff_name: string; count: number }[];
}

// Form data types
export interface CreateVisitData {
  customer_id: string;
  staff_id?: string;
  visit_type: VisitType;
  notes?: string;
  check_in_time?: Date;
}

export interface UpdateVisitData {
  staff_id?: string;
  visit_type?: VisitType;
  notes?: string;
  check_out_time?: Date;
}

// Visit filters
export interface VisitFilters {
  customer_id?: string;
  staff_id?: string;
  visit_type?: VisitType;
  date_from?: string;
  date_to?: string;
  has_checkout?: boolean;
  page?: number;
  limit?: number;
}

// Visit with related data
export interface VisitWithCustomer extends Visit {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface VisitWithStaff extends Visit {
  staff: {
    id: string;
    name: string;
    role: string;
  };
}

export interface VisitWithDetails extends Visit {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  staff?: {
    id: string;
    name: string;
    email: string;
  };
}

// Visit check-in interface
export interface VisitCheckIn {
  customer_id: string;
  staff_id?: string;
  visit_type: VisitType;
  notes?: string;
}

// Visit check-out interface
export interface VisitCheckOut {
  visit_id: string;
  check_out_time: Date;
  notes?: string;
}

// Visit notification types
export interface VisitNotification {
  id: string;
  customer_id: string;
  visit_id: string;
  notification_type: 'welcome_back' | 'milestone' | 'birthday' | 'reward_earned';
  message: string;
  sent: boolean;
  sent_at?: Date;
  created_at: Date;
}

// Visit milestone tracking
export interface VisitMilestone {
  id: string;
  customer_id: string;
  milestone_type: 'first_visit' | 'tenth_visit' | 'fiftieth_visit' | 'hundredth_visit';
  visit_count: number;
  achieved_at: Date;
  reward_generated: boolean;
  created_at: Date;
} 