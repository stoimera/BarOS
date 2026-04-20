import { createClient } from '@/utils/supabase/client';
import { 
  Visit, 
  VisitWithDetails, 
  VisitQRCode, 
  CreateVisitData, 
  UpdateVisitData, 
  VisitFilters,
  VisitStats,
  VisitAnalytics,
  VisitCheckIn,
  VisitCheckOut,
  VisitMilestone
} from '@/types/visit';
import { api } from '@/lib/api/client';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// =====================================================
// VISITS CRUD OPERATIONS
// =====================================================

export async function getVisits(filters?: VisitFilters): Promise<VisitWithDetails[]> {
  try {
  
    const params = new URLSearchParams();
    
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.staff_id) params.append('staff_id', filters.staff_id);
    if (filters?.visit_type) params.append('visit_type', filters.visit_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.has_checkout !== undefined) params.append('has_checkout', filters.has_checkout.toString());
    
    const { data } = await api.get<{ data: VisitWithDetails[] }>(`/api/visits?${params.toString()}`);
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch visits:', error);
    throw error;
  }
}

export async function getVisitById(id: string): Promise<VisitWithDetails | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      customer:customers(id, name, email, phone),
      staff:staff(id, position)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching visit:', error);
    throw new Error('Failed to fetch visit');
  }

  return data;
}

export async function createVisit(visitData: CreateVisitData): Promise<Visit> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visits')
    .insert([visitData])
    .select()
    .single();

  if (error) {
    console.error('Error creating visit:', error);
    throw new Error('Failed to create visit');
  }

  return data;
}

export async function updateVisit(id: string, updates: UpdateVisitData): Promise<Visit> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating visit:', error);
    throw new Error('Failed to update visit');
  }

  return data;
}

export async function deleteVisit(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting visit:', error);
    throw new Error('Failed to delete visit');
  }
}

// =====================================================
// VISIT CHECK-IN/CHECK-OUT
// =====================================================

// Helper function to get staff ID from user ID
async function getStaffIdFromUserId(userId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    // First, get the profile_id from the profiles table using user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
  
      return null;
    }

    // Then, get the staff_id from the staff table using profile_id (supabase already initialized)
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (staffError || !staff) {
  
      return null;
    }

    return staff.id;
  } catch (error) {
    console.error('Error getting staff ID from user ID:', error);
    return null;
  }
}

export async function checkInCustomer(checkInData: VisitCheckIn): Promise<Visit> {

  
  const visitData: any = {
    customer_id: checkInData.customer_id,
    visit_type: checkInData.visit_type,
    notes: checkInData.notes,
    check_in_time: new Date().toISOString(),
    visit_date: new Date().toISOString().split('T')[0]
  };

  // Try to get the correct staff_id from user_id if provided
  if (checkInData.staff_id) {
    const correctStaffId = await getStaffIdFromUserId(checkInData.staff_id);
    if (correctStaffId) {
      visitData.staff_id = correctStaffId;
  
    } else {
  
    }
  }

  

    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visits')
    .insert([visitData])
    .select()
    .single();

  if (error) {
    console.error('Error checking in customer:', error);
    console.error('Visit data attempted:', visitData);
    console.error('CheckInData received:', checkInData);
    throw new Error('Failed to check in customer');
  }

  return data;
}

export async function checkOutCustomer(checkOutData: VisitCheckOut): Promise<Visit> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visits')
    .update({
      check_out_time: new Date().toISOString(),
      notes: checkOutData.notes
    })
    .eq('id', checkOutData.visit_id)
    .select()
    .single();

  if (error) {
    console.error('Error checking out customer:', error);
    throw new Error('Failed to check out customer');
  }

  return data;
}

// =====================================================
// QR CODE OPERATIONS
// =====================================================

export async function generateVisitQRCode(customerId: string, visitType: string): Promise<VisitQRCode> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visit_qr_codes')
    .insert([{
      customer_id: customerId,
      visit_type: visitType,
      expires_at: expiresAt.toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }

  return data;
}

export async function useVisitQRCode(qrCodeId: string): Promise<VisitQRCode> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visit_qr_codes')
    .update({
      used: true,
      used_at: new Date().toISOString()
    })
    .eq('id', qrCodeId)
    .select()
    .single();

  if (error) {
    console.error('Error using QR code:', error);
    throw new Error('Failed to use QR code');
  }

  return data;
}

export async function getCustomerQRCodes(customerId: string): Promise<VisitQRCode[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('visit_qr_codes')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching QR codes:', error);
    throw new Error('Failed to fetch QR codes');
  }

  return data || [];
}

// =====================================================
// VISIT STATISTICS AND ANALYTICS
// =====================================================

export async function getVisitStats(customerId: string): Promise<VisitStats> {
  const supabase = getSupabase();
  const { data: visits, error } = await supabase
    .from('visits')
    .select('visit_date, check_in_time')
    .eq('customer_id', customerId)
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('Error fetching visit stats:', error);
    throw new Error('Failed to fetch visit stats');
  }

  const totalVisits = visits?.length || 0;
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const visitsThisMonth = visits?.filter(v => new Date(v.visit_date) >= thisMonth).length || 0;
  const visitsThisWeek = visits?.filter(v => new Date(v.visit_date) >= thisWeek).length || 0;
  const lastVisitDate = visits?.[0]?.visit_date ? new Date(visits[0].visit_date) : undefined;

  // Calculate average visits per month
  const firstVisit = visits?.[visits.length - 1]?.visit_date;
  let averageVisitsPerMonth = 0;
  if (firstVisit && totalVisits > 0) {
    const monthsDiff = (now.getTime() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24 * 30);
    averageVisitsPerMonth = monthsDiff > 0 ? totalVisits / monthsDiff : totalVisits;
  }

  return {
    total_visits: totalVisits,
    visits_this_month: visitsThisMonth,
    visits_this_week: visitsThisWeek,
    average_visits_per_month: Math.round(averageVisitsPerMonth * 100) / 100,
    last_visit_date: lastVisitDate
  };
}

export async function getVisitAnalytics(): Promise<VisitAnalytics> {
  // This would be implemented with more complex queries
  // For now, returning basic structure
  return {
    visits_by_day: [],
    visits_by_hour: [],
    visits_by_type: [],
    top_staff_checkins: []
  };
}

// =====================================================
// VISIT MILESTONES
// =====================================================

export async function checkAndCreateMilestones(customerId: string): Promise<VisitMilestone[]> {
  const supabase = getSupabase();
  const { data: visits, error } = await supabase
    .from('visits')
    .select('id, visit_date')
    .eq('customer_id', customerId)
    .order('visit_date', { ascending: true });

  if (error) {
    console.error('Error checking milestones:', error);
    throw new Error('Failed to check milestones');
  }

  const visitCount = visits?.length || 0;
  const milestones = [];

  // Check for milestone achievements
  const milestoneTypes = [
    { type: 'first_visit', count: 1 },
    { type: 'tenth_visit', count: 10 },
    { type: 'fiftieth_visit', count: 50 },
    { type: 'hundredth_visit', count: 100 }
  ];

  for (const milestone of milestoneTypes) {
    if (visitCount >= milestone.count) {
      // Check if milestone already exists (supabase already initialized)
      const { data: existingMilestone } = await supabase
        .from('visit_milestones')
        .select('id')
        .eq('customer_id', customerId)
        .eq('milestone_type', milestone.type)
        .single();

      if (!existingMilestone) {
        // Create milestone (supabase already initialized)
        const { data: newMilestone, error: milestoneError } = await supabase
          .from('visit_milestones')
          .insert([{
            customer_id: customerId,
            milestone_type: milestone.type,
            visit_count: milestone.count,
            achieved_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (!milestoneError && newMilestone) {
          milestones.push(newMilestone);
        }
      }
    }
  }

  return milestones;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getCurrentUserVisits(): Promise<VisitWithDetails[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get customer record for current user (supabase already initialized)
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  return getVisits({ customer_id: customer.id });
}

export async function getStaffCheckIns(staffId: string, date?: string): Promise<VisitWithDetails[]> {
  const filters: VisitFilters = { staff_id: staffId };
  if (date) {
    filters.date_from = date;
    filters.date_to = date;
  }

  return getVisits(filters);
} 