import { supabase } from './supabase'
import { Staff, StaffRole, StaffPermission, StaffSchedule, StaffPerformance } from '@/types/common'
import { StaffMember } from '@/types/schedule'

// Staff CRUD operations
export async function fetchStaff({ search = '', role = '', isActive = true }: { 
  search?: string
  role?: string
  isActive?: boolean 
}) {
  let query = supabase
    .from('staff')
    .select('*', { count: 'exact' })
    .eq('is_active', isActive)
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  
  if (role) {
    query = query.eq('role', role)
  }
  
  query = query.order('name', { ascending: true })
  const { data, count, error } = await query
  
  if (error) throw error
  return { data: data as Staff[], count }
}

export async function fetchStaffById(id: string): Promise<Staff> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Staff
}

export async function createStaff(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('staff')
    .insert([staff])
    .select()
    .single()
  
  if (error) throw error
  return data as Staff
}

export async function updateStaff(id: string, updates: Partial<Staff>) {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Staff
}

export async function deleteStaff(id: string) {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Staff scheduling
export async function fetchStaffSchedule(staffId: string, startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', staffId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  if (error) throw error
  return data as StaffSchedule[]
}

export async function createStaffSchedule(schedule: Omit<StaffSchedule, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('staff_schedules')
    .insert([schedule])
    .select()
    .single()
  
  if (error) throw error
  return data as StaffSchedule
}

export async function updateStaffSchedule(id: string, updates: Partial<StaffSchedule>) {
  const { data, error } = await supabase
    .from('staff_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as StaffSchedule
}

export async function deleteStaffSchedule(id: string) {
  const { error } = await supabase
    .from('staff_schedules')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Staff performance
export async function fetchStaffPerformance(staffId: string) {
  const { data, error } = await supabase
    .from('staff_performance')
    .select('*')
    .eq('staff_id', staffId)
    .order('period_start', { ascending: false })
  
  if (error) throw error
  return data as StaffPerformance[]
}

export async function createStaffPerformance(performance: Omit<StaffPerformance, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('staff_performance')
    .insert([performance])
    .select()
    .single()
  
  if (error) throw error
  return data as StaffPerformance
}

export async function updateStaffPerformance(id: string, updates: Partial<StaffPerformance>) {
  const { data, error } = await supabase
    .from('staff_performance')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as StaffPerformance
}

// Staff statistics
export async function getStaffStats() {
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
  
  if (staffError) throw staffError
  
  const totalStaff = staff?.length || 0
  const activeStaff = staff?.filter(s => s.is_active).length || 0
  
  // Calculate role distribution
  const roleDistribution = staff?.reduce((acc: any, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1
    return acc
  }, {}) || {}
  
  // Calculate average performance (if performance data exists)
  const { data: performance } = await supabase
    .from('staff_performance')
    .select('customer_rating, manager_rating')
    .not('customer_rating', 'is', null)
  
  const avgCustomerRating = performance && performance.length > 0 
    ? performance.reduce((sum, p) => sum + (p.customer_rating || 0), 0) / performance.length
    : 0
  
  const avgManagerRating = performance && performance.length > 0
    ? performance.reduce((sum, p) => sum + (p.manager_rating || 0), 0) / performance.length
    : 0
  
  return {
    totalStaff,
    activeStaff,
    roleDistribution,
    avgCustomerRating: Math.round(avgCustomerRating * 100) / 100,
    avgManagerRating: Math.round(avgManagerRating * 100) / 100
  }
}

// Permission helpers
export function getRolePermissions(role: StaffRole): StaffPermission[] {
  const permissions: Record<StaffRole, StaffPermission[]> = {
    [StaffRole.OWNER]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.EDIT_CUSTOMERS,
      StaffPermission.VIEW_EVENTS,
      StaffPermission.MANAGE_EVENTS,
      StaffPermission.VIEW_BOOKINGS,
      StaffPermission.MANAGE_BOOKINGS,
      StaffPermission.VIEW_INVENTORY,
      StaffPermission.MANAGE_INVENTORY,
      StaffPermission.VIEW_LOYALTY,
      StaffPermission.MANAGE_LOYALTY,
      StaffPermission.VIEW_ANALYTICS,
      StaffPermission.MANAGE_STAFF,
      StaffPermission.VIEW_FINANCIAL,
      StaffPermission.MANAGE_FINANCIAL
    ],
    [StaffRole.MANAGER]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.EDIT_CUSTOMERS,
      StaffPermission.VIEW_EVENTS,
      StaffPermission.MANAGE_EVENTS,
      StaffPermission.VIEW_BOOKINGS,
      StaffPermission.MANAGE_BOOKINGS,
      StaffPermission.VIEW_INVENTORY,
      StaffPermission.MANAGE_INVENTORY,
      StaffPermission.VIEW_LOYALTY,
      StaffPermission.MANAGE_LOYALTY,
      StaffPermission.VIEW_ANALYTICS,
      StaffPermission.MANAGE_STAFF
    ],
    [StaffRole.BARTENDER]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.VIEW_EVENTS,
      StaffPermission.VIEW_BOOKINGS,
      StaffPermission.VIEW_INVENTORY,
      StaffPermission.VIEW_LOYALTY
    ],
    [StaffRole.SERVER]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.VIEW_EVENTS,
      StaffPermission.VIEW_BOOKINGS,
      StaffPermission.VIEW_INVENTORY
    ],
    [StaffRole.HOST]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.VIEW_EVENTS,
      StaffPermission.VIEW_BOOKINGS
    ],
    [StaffRole.SECURITY]: [
      StaffPermission.VIEW_CUSTOMERS,
      StaffPermission.VIEW_EVENTS
    ],
    [StaffRole.CLEANER]: [
      StaffPermission.VIEW_INVENTORY
    ]
  }
  
  return permissions[role] || []
}

export function hasPermission(userPermissions: StaffPermission[], requiredPermission: StaffPermission): boolean {
  return userPermissions.includes(requiredPermission)
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
  if (error) throw error
  return data as StaffMember[]
} 