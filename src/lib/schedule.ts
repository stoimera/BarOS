import { createClient } from '@/utils/supabase/client';
import { 
  StaffMember, 
  Shift, 
  ShiftWithStaff, 
  CreateShiftData, 
  UpdateShiftData, 
  ShiftFilters 
} from '@/types/schedule';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// =====================================================
// STAFF MEMBERS CRUD
// =====================================================

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('staff_members')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        position,
        hire_date,
        permissions,
        hourly_rate,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      console.error('Error fetching staff members:', error);
      return [];
    }

    // Transform the data to match the expected interface
    const transformedData = (data || []).map(staff => ({
      ...staff,
      profile_id: staff.user_id, // Map user_id to profile_id for compatibility
      name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown',
      email: 'staff@example.com', // Placeholder since email is in profiles
      role: staff.position || 'staff'
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return [];
  }
}

export async function getStaffMemberById(id: string): Promise<StaffMember | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('staff_members')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      position,
      hire_date,
      permissions,
      hourly_rate,
      is_active,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }

  if (!data) return null;

  // Transform the data to match the expected interface
  return {
    ...data,
    profile_id: data.user_id, // Map user_id to profile_id for compatibility
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
    email: 'staff@example.com',
    role: data.position || 'staff'
  };
}

// =====================================================
// SHIFTS CRUD
// =====================================================

export async function getShifts(filters?: ShiftFilters): Promise<ShiftWithStaff[]> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('shifts')
      .select(`
        id,
        staff_id,
        shift_date,
        start_time,
        end_time,
        role,
        notes,
        is_active,
        created_at,
        updated_at
      `)
      .order('shift_date', { ascending: true });

    if (filters?.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }

    if (filters?.date_from) {
      query = query.gte('shift_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('shift_date', filters.date_to);
    }

    const { data: shifts, error: shiftsError } = await query;

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      return [];
    }

    if (!shifts || shifts.length === 0) {
      return [];
    }

    // Fetch staff data for each shift
    const transformedShifts: ShiftWithStaff[] = [];

    for (const shift of shifts) {
      try {
        const supabase = getSupabase();
        // Try to get staff member data
        const { data: staffData, error: staffError } = await supabase
          .from('staff_members')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            position,
            hire_date,
            permissions,
            hourly_rate,
            is_active,
            created_at,
            updated_at
          `)
          .eq('id', shift.staff_id)
          .single();

        const transformedShift: ShiftWithStaff = {
          ...shift,
          staff: staffData && !staffError ? {
            ...staffData,
            name: `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim() || 'Unknown Staff',
            email: 'staff@example.com',
            role: staffData.position || 'staff'
          } : {
            id: 'unknown',
            profile_id: undefined,
            user_id: undefined,
            first_name: 'Unknown',
            last_name: 'Staff',
            position: 'Unknown',
            hire_date: '1970-01-01',
            permissions: [],
            hourly_rate: undefined,
            is_active: false,
            created_at: '1970-01-01T00:00:00Z',
            updated_at: '1970-01-01T00:00:00Z',
            name: 'Unknown Staff',
            email: 'unknown@example.com',
            role: 'staff'
          }
        };

        transformedShifts.push(transformedShift);
      } catch (staffFetchError) {
        console.warn(`Could not fetch staff data for shift ${shift.id}:`, staffFetchError);
                 // Add shift with default staff data
         transformedShifts.push({
           ...shift,
           staff: {
             id: 'unknown',
             profile_id: undefined,
             user_id: undefined,
             first_name: 'Unknown',
             last_name: 'Staff',
             position: 'Unknown',
             hire_date: '1970-01-01',
             permissions: [],
             hourly_rate: undefined,
             is_active: false,
             created_at: '1970-01-01T00:00:00Z',
             updated_at: '1970-01-01T00:00:00Z',
             name: 'Unknown Staff',
             email: 'unknown@example.com',
             role: 'staff'
           }
         });
      }
    }

    return transformedShifts;
  } catch (error) {
    console.error('Critical error in getShifts:', error);
    return [];
  }
}

export async function getShiftById(id: string): Promise<ShiftWithStaff | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      id,
      staff_id,
      shift_date,
      start_time,
      end_time,
      role,
      notes,
      is_active,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching shift:', error);
    return null;
  }

  if (!data) return null;

  // Get staff data (supabase already initialized above)
  const { data: staffData, error: staffError } = await supabase
    .from('staff_members')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      position,
      hire_date,
      permissions,
      hourly_rate,
      is_active,
      created_at,
      updated_at
    `)
    .eq('id', data.staff_id)
    .single();

  return {
    ...data,
    staff: staffData && !staffError ? {
      ...staffData,
      name: `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim() || 'Staff Member',
      email: 'staff@example.com',
      role: staffData.position || 'staff'
    } : {
      id: 'unknown',
      profile_id: undefined,
      user_id: undefined,
      first_name: 'Unknown',
      last_name: 'Staff',
      position: 'Unknown',
      hire_date: '1970-01-01',
      permissions: [],
      hourly_rate: undefined,
      is_active: false,
      created_at: '1970-01-01T00:00:00Z',
      updated_at: '1970-01-01T00:00:00Z',
      name: 'Unknown Staff',
      email: 'unknown@example.com',
      role: 'staff'
    }
  };
}

export async function getShiftsByStaff(staffId: string): Promise<ShiftWithStaff[]> {
  try {
    const supabase = getSupabase();
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        id,
        staff_id,
        shift_date,
        start_time,
        end_time,
        role,
        notes,
        is_active,
        created_at,
        updated_at
      `)
      .eq('staff_id', staffId)
      .order('shift_date', { ascending: true });

    if (shiftsError) {
      console.error('Error fetching shifts by staff:', shiftsError);
      return [];
    }

    if (!shifts || shifts.length === 0) {
      return [];
    }

    // Get staff data for the staff member (supabase already initialized above)
    const { data: staffData, error: staffError } = await supabase
      .from('staff_members')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        position,
        hire_date,
        permissions,
        hourly_rate,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', staffId)
      .single();

    const staffMember = staffData && !staffError ? {
      ...staffData,
      name: `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim() || 'Staff Member',
      email: 'staff@example.com',
      role: staffData.position || 'staff'
    } : {
      id: 'unknown',
      profile_id: undefined,
      user_id: undefined,
      first_name: 'Unknown',
      last_name: 'Staff',
      position: 'Unknown',
      hire_date: '1970-01-01',
      permissions: [],
      hourly_rate: undefined,
      is_active: false,
      created_at: '1970-01-01T00:00:00Z',
      updated_at: '1970-01-01T00:00:00Z',
      name: 'Unknown Staff',
      email: 'unknown@example.com',
      role: 'staff'
    };

    // Transform shifts to include staff data
    return shifts.map(shift => ({
      ...shift,
      staff: staffMember
    }));
  } catch (error) {
    console.error('Error in getShiftsByStaff:', error);
    return [];
  }
}

export async function getStaffMemberByUserId(userId: string): Promise<StaffMember | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('staff_members')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      position,
      hire_date,
      permissions,
      hourly_rate,
      is_active,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    // Expected when user has no linked active staff row.
    if (error.code !== 'PGRST116' && process.env.NODE_ENV !== 'production') {
      console.error('Error fetching staff member by user ID:', error);
    }
    return null;
  }

  if (!data) return null;

  // Transform the data to match the expected interface
  return {
    ...data,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Staff Member',
    email: 'staff@example.com',
    role: data.position || 'staff'
  };
}

export async function createShift(shiftData: CreateShiftData): Promise<Shift> {
  try {
    if (!shiftData.staff_id || !shiftData.shift_date || !shiftData.start_time || !shiftData.end_time) {
      throw new Error('Missing required fields: staff_id, shift_date, start_time, end_time');
    }

    const supabase = getSupabase();

    // Verify that the staff member exists in staff_members table
    const { data: staffMember, error: staffError } = await supabase
      .from('staff_members')
      .select('id, is_active')
      .eq('id', shiftData.staff_id)
      .single();

    if (staffError || !staffMember) {
      throw new Error(`Staff member with ID ${shiftData.staff_id} not found`);
    }
    
    if (!staffMember.is_active) {
      throw new Error(`Staff member ${staffMember.id} is not active`);
    }

    const insertData = {
      staff_id: shiftData.staff_id,
      shift_date: shiftData.shift_date,
      start_time: shiftData.start_time,
      end_time: shiftData.end_time,
      role: shiftData.role || 'staff',
      notes: shiftData.notes || null,
      is_active: true
    };

    // supabase already initialized above
    const { data, error } = await supabase
      .from('shifts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from shift creation');
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function updateShift(id: string, updates: UpdateShiftData): Promise<Shift> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shift:', error);
    throw new Error('Failed to update shift');
  }

  return data;
}

export async function deleteShift(id: string): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }
  } catch (error) {
    throw error;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function checkUserIsStaff(): Promise<boolean> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  try {
    // supabase already initialized above
    const { data: staffMember } = await supabase
      .from('staff_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    return !!staffMember;
  } catch {
    return false;
  }
}

export async function checkUserIsAdmin(): Promise<boolean> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // supabase already initialized above
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return profile?.role === 'admin';
} 