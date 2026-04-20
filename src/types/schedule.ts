// Staff Scheduling Types

export interface StaffMember {
  id: string;
  profile_id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  position: string;
  hire_date: string;
  permissions: string[];
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields for display
  name?: string;
  email?: string;
  role?: string;
}

export interface Shift {
  id: string;
  staff_id: string;
  shift_date: string; // Changed from 'date' to match database schema
  start_time: string; // Required - NOT NULL in database
  end_time: string; // Required - NOT NULL in database
  role: string; // Required - matches database schema
  notes?: string;
  is_active?: boolean; // Added to match database schema
  created_at: string;
  updated_at: string;
}

export interface ShiftWithStaff extends Shift {
  staff: StaffMember;
}

export type StaffRole = 'bartender' | 'server' | 'host' | 'security' | 'cleaner' | 'manager';

export type ShiftType = '8AM-4PM' | '4PM-12AM' | '8AM-12AM';

// Form data types
export interface CreateStaffMemberData {
  user_id: string;
  name: string;
  email: string;
  role: StaffRole;
  is_active?: boolean;
}

export interface UpdateStaffMemberData {
  name?: string;
  email?: string;
  role?: StaffRole;
  is_active?: boolean;
}

export interface CreateShiftData {
  staff_id: string;
  shift_date: string; // Changed from 'date' to match database schema
  start_time: string; // Required - NOT NULL in database
  end_time: string; // Required - NOT NULL in database
  role: string; // Required - matches database schema
  notes?: string;
}

export interface UpdateShiftData {
  staff_id?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  role?: string;
  notes?: string;
  is_active?: boolean;
}

// Filter types
export interface ShiftFilters {
  staff_id?: string;
  date_from?: string;
  date_to?: string;
  shift_type?: ShiftType;
}

// Schedule view types
export interface ScheduleView {
  type: 'calendar' | 'list' | 'weekly' | 'monthly';
  groupBy: 'date' | 'staff';
}

// Shift time mappings
export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  '8AM-4PM': { start: '08:00', end: '16:00' },
  '4PM-12AM': { start: '16:00', end: '00:00' },
  '8AM-12AM': { start: '08:00', end: '00:00' }
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<StaffRole, string> = {
  bartender: 'Bartender',
  server: 'Server',
  host: 'Host',
  security: 'Security',
  cleaner: 'Cleaner',
  manager: 'Manager'
};

// Shift type display names
export const SHIFT_TYPE_DISPLAY_NAMES: Record<ShiftType, string> = {
  '8AM-4PM': 'First Shift (8AM-4PM)',
  '4PM-12AM': 'Second Shift (4PM-12AM)',
  '8AM-12AM': 'Full Day (8AM-12AM)'
}; 