export type UserRole = 'staff' | 'customer' | 'admin'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
  permissions?: string[]
  is_active: boolean
}

export interface InvitationCode {
  id: string
  code: string
  role: UserRole
  created_by: string
  created_at: string
  expires_at: string
  used_by?: string
  used_count?: number
  is_active: boolean
  max_uses?: number
  // Joined data from database queries
  created_by_user?: { first_name: string; last_name: string; email: string }
  used_by_user?: { first_name: string; last_name: string; email: string }
}

export interface RegistrationData {
  email: string
  password: string
  name: string
  role: UserRole
  staff_invitation_code?: string
  owner_invitation_code?: string
  phone?: string
  referral_code?: string
} 