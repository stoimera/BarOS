import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// Reuse one lazy-initialized client instance across analytics calls.
const supabase = getSupabase();

// =====================================================
// ADVANCED ANALYTICS SYSTEM
// =====================================================

export interface CustomerAnalytics {
  total_customers: number;
  new_customers_this_month: number;
  active_customers_this_month: number;
  customer_growth_rate: number;
  average_customer_lifetime_value: number;
  customer_retention_rate: number;
  top_customers: Array<{
    id: string;
    name: string;
    total_visits: number;
    total_spent: number;
    last_visit: string;
  }>;
  customer_segments: {
    vip: number;
    regular: number;
    occasional: number;
    inactive: number;
  };
}

export interface VisitAnalytics {
  total_visits: number;
  visits_this_month: number;
  visits_this_week: number;
  average_visits_per_customer: number;
  peak_visiting_hours: Array<{ hour: number; count: number }>;
  visit_trends: Array<{ date: string; count: number }>;
  visit_types: {
    regular: number;
    event: number;
    special: number;
    birthday: number;
    vip: number;
  };
}

export interface RevenueAnalytics {
  total_revenue: number;
  revenue_this_month: number;
  revenue_this_week: number;
  average_order_value: number;
  revenue_growth_rate: number;
  revenue_by_category: Array<{ category: string; amount: number }>;
  revenue_trends: Array<{ date: string; amount: number }>;
  top_revenue_sources: Array<{ source: string; amount: number }>;
}

export interface RewardAnalytics {
  total_rewards_issued: number;
  total_rewards_redeemed: number;
  redemption_rate: number;
  average_reward_value: number;
  rewards_by_category: Array<{ category: string; count: number; value: number }>;
  top_reward_types: Array<{ type: string; count: number }>;
  reward_trends: Array<{ date: string; issued: number; redeemed: number }>;
}

export interface StaffAnalytics {
  total_staff: number;
  active_staff: number;
  staff_performance: Array<{
    id: string;
    name: string;
    check_ins: number;
    customer_interactions: number;
    efficiency_score: number;
  }>;
  shift_coverage: Array<{ day: string; coverage: number }>;
  staff_utilization: number;
}

export interface BusinessMetrics {
  customer_satisfaction_score: number;
  net_promoter_score: number;
  customer_acquisition_cost: number;
  customer_lifetime_value: number;
  churn_rate: number;
  repeat_visit_rate: number;
  average_session_duration: number;
  conversion_rate: number;
}

// =====================================================
// ANALYTICS FUNCTIONS
// =====================================================

export async function getCustomerAnalytics(): Promise<CustomerAnalytics> {
  try {
    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Get new customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newCustomersThisMonth } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Get active customers this month (customers with visits)
    const { data: activeCustomers } = await supabase
      .from('visits')
      .select('customer_id')
      .gte('visit_date', startOfMonth.toISOString())
      .not('customer_id', 'is', null);

    const uniqueActiveCustomers = new Set(activeCustomers?.map(v => v.customer_id) || []).size;

    // Calculate growth rate (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const { count: lastMonthCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startOfMonth.toISOString())
      .gte('created_at', lastMonth.toISOString());

    const growthRate = lastMonthCustomers && lastMonthCustomers > 0 
      ? ((newCustomersThisMonth || 0) / lastMonthCustomers) * 100 
      : 0;

    // Get top customers
    const { data: topCustomers } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        visits!inner(visit_date),
        loyalty(points)
      `)
      .order('loyalty.points', { ascending: false })
      .limit(10);

    // Calculate customer segments
    const { data: allCustomers } = await supabase
      .from('customers')
      .select(`
        id,
        loyalty(tier, points),
        visits(visit_date)
      `);

    const segments = {
      vip: 0,
      regular: 0,
      occasional: 0,
      inactive: 0
    };

    allCustomers?.forEach(customer => {
      const loyalty = Array.isArray(customer.loyalty) ? customer.loyalty[0] : customer.loyalty;
      const tier = loyalty?.tier || 'bronze';
      const points = loyalty?.points || 0;
      const visitCount = customer.visits?.length || 0;

      if (tier === 'platinum' || tier === 'gold' || points > 1000) {
        segments.vip++;
      } else if (visitCount > 5 || points > 100) {
        segments.regular++;
      } else if (visitCount > 0) {
        segments.occasional++;
      } else {
        segments.inactive++;
      }
    });

    return {
      total_customers: totalCustomers || 0,
      new_customers_this_month: newCustomersThisMonth || 0,
      active_customers_this_month: uniqueActiveCustomers,
      customer_growth_rate: Math.round(growthRate * 100) / 100,
      average_customer_lifetime_value: 0, // Would need transaction data
      customer_retention_rate: 0, // Would need historical data
      top_customers: topCustomers?.map(c => ({
        id: c.id,
        name: c.name,
        total_visits: c.visits?.length || 0,
        total_spent: 0, // Would need transaction data
        last_visit: c.visits?.[0]?.visit_date || ''
      })) || [],
      customer_segments: segments
    };
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    throw new Error('Failed to fetch customer analytics');
  }
}

export async function getVisitAnalytics(): Promise<VisitAnalytics> {
  try {
    // Get total visits
    const { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    // Get visits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: visitsThisMonth } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('visit_date', startOfMonth.toISOString());

    // Get visits this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const { count: visitsThisWeek } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('visit_date', startOfWeek.toISOString());

    // Get visit types
    const { data: visitTypes } = await supabase
      .from('visits')
      .select('visit_type');

    const typeCounts = {
      regular: 0,
      event: 0,
      special: 0,
      birthday: 0,
      vip: 0
    };

    visitTypes?.forEach(visit => {
      const type = visit.visit_type || 'regular';
      if (typeCounts.hasOwnProperty(type)) {
        typeCounts[type as keyof typeof typeCounts]++;
      }
    });

    // Get peak visiting hours
    const { data: visitsWithTime } = await supabase
      .from('visits')
      .select('check_in_time')
      .not('check_in_time', 'is', null);

    const hourCounts: Record<number, number> = {};
    visitsWithTime?.forEach(visit => {
      if (visit.check_in_time) {
        const hour = new Date(visit.check_in_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average visits per customer
    const { data: customers } = await supabase
      .from('customers')
      .select('visits!inner(id)');

    const totalCustomers = customers?.length || 1;
    const averageVisits = totalVisits ? totalVisits / totalCustomers : 0;

    // Get visit trends (last 30 days)
    const visitTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', startOfDay.toISOString())
        .lte('visit_date', endOfDay.toISOString());

      visitTrends.push({
        date: date.toISOString().split('T')[0],
        count: count || 0
      });
    }

    return {
      total_visits: totalVisits || 0,
      visits_this_month: visitsThisMonth || 0,
      visits_this_week: visitsThisWeek || 0,
      average_visits_per_customer: Math.round(averageVisits * 100) / 100,
      peak_visiting_hours: peakHours,
      visit_trends: visitTrends,
      visit_types: typeCounts
    };
  } catch (error) {
    console.error('Error fetching visit analytics:', error);
    throw new Error('Failed to fetch visit analytics');
  }
}

export async function getRewardAnalytics(): Promise<RewardAnalytics> {
  try {
    // Get total rewards issued
    const { count: totalIssued } = await supabase
      .from('enhanced_rewards')
      .select('*', { count: 'exact', head: true });

    // Get total rewards redeemed
    const { count: totalRedeemed } = await supabase
      .from('enhanced_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('claimed', true);

    const redemptionRate = totalIssued ? (totalRedeemed || 0) / totalIssued * 100 : 0;

    // Get rewards by category
    const { data: rewardsByCategory } = await supabase
      .from('enhanced_rewards')
      .select('category, value');

    const categoryStats: Record<string, { count: number; value: number }> = {};
    rewardsByCategory?.forEach(reward => {
      const category = reward.category || 'other';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, value: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].value += reward.value || 0;
    });

    const rewardsByCategoryArray = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      value: stats.value
    }));

    // Get top reward types
    const { data: topRewardTypes } = await supabase
      .from('enhanced_rewards')
      .select('description');

    const typeCounts: Record<string, number> = {};
    topRewardTypes?.forEach(reward => {
      const type = reward.description || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const topTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average reward value
    const { data: allRewards } = await supabase
      .from('enhanced_rewards')
      .select('value');

    const totalValue = allRewards?.reduce((sum, reward) => sum + (reward.value || 0), 0) || 0;
    const averageValue = totalIssued ? totalValue / totalIssued : 0;

    // Get reward trends (last 30 days)
    const rewardTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { count: issued } = await supabase
        .from('enhanced_rewards')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      const { count: redeemed } = await supabase
        .from('enhanced_rewards')
        .select('*', { count: 'exact', head: true })
        .eq('claimed', true)
        .gte('claimed_at', startOfDay.toISOString())
        .lte('claimed_at', endOfDay.toISOString());

      rewardTrends.push({
        date: date.toISOString().split('T')[0],
        issued: issued || 0,
        redeemed: redeemed || 0
      });
    }

    return {
      total_rewards_issued: totalIssued || 0,
      total_rewards_redeemed: totalRedeemed || 0,
      redemption_rate: Math.round(redemptionRate * 100) / 100,
      average_reward_value: Math.round(averageValue * 100) / 100,
      rewards_by_category: rewardsByCategoryArray,
      top_reward_types: topTypes,
      reward_trends: rewardTrends
    };
  } catch (error) {
    console.error('Error fetching reward analytics:', error);
    throw new Error('Failed to fetch reward analytics');
  }
}

export async function getStaffAnalytics(): Promise<StaffAnalytics> {
  try {
    // Get total staff
    const { count: totalStaff } = await supabase
      .from('staff_members')
      .select('*', { count: 'exact', head: true });

    // Get active staff
    const { count: activeStaff } = await supabase
      .from('staff_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get staff performance
    const { data: staffPerformance } = await supabase
      .from('staff_members')
      .select(`
        id,
        first_name,
        last_name,
        visits!inner(id),
        shifts!inner(id)
      `)
      .eq('is_active', true);

    const performanceData = staffPerformance?.map(staff => {
      const checkIns = staff.visits?.length || 0;
      const shifts = staff.shifts?.length || 0;
      const efficiencyScore = shifts > 0 ? (checkIns / shifts) * 100 : 0;

      return {
        id: staff.id,
        name: `${staff.first_name} ${staff.last_name}`,
        check_ins: checkIns,
        customer_interactions: checkIns, // Simplified
        efficiency_score: Math.round(efficiencyScore * 100) / 100
      };
    }) || [];

    // Calculate staff utilization
    const totalShifts = performanceData.reduce((sum, staff) => sum + staff.check_ins, 0);
    const utilization = totalStaff ? (totalShifts / totalStaff) * 100 : 0;

    // Get shift coverage (simplified)
    const shiftCoverage = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      const { count } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('day_of_week', day);

      shiftCoverage.push({
        day,
        coverage: count || 0
      });
    }

    return {
      total_staff: totalStaff || 0,
      active_staff: activeStaff || 0,
      staff_performance: performanceData,
      shift_coverage: shiftCoverage,
      staff_utilization: Math.round(utilization * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching staff analytics:', error);
    throw new Error('Failed to fetch staff analytics');
  }
}

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  try {
    // Calculate customer satisfaction score (simplified)
    const { data: feedback } = await supabase
      .from('feedback')
      .select('rating');

    const totalRatings = feedback?.length || 0;
    const averageRating = totalRatings > 0 
      ? feedback!.reduce((sum, f) => sum + (f.rating || 0), 0) / totalRatings
      : 0;

    // Calculate repeat visit rate
    const { data: customers } = await supabase
      .from('customers')
      .select('visits!inner(id)');

    const customersWithMultipleVisits = customers?.filter(c => c.visits && c.visits.length > 1).length || 0;
    const totalCustomers = customers?.length || 1;
    const repeatVisitRate = (customersWithMultipleVisits / totalCustomers) * 100;

    // Calculate churn rate (simplified - customers with no visits in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentVisits } = await supabase
      .from('visits')
      .select('customer_id')
      .gte('visit_date', thirtyDaysAgo.toISOString());

    const activeCustomers = new Set(recentVisits?.map(v => v.customer_id) || []).size;
    const churnRate = totalCustomers > 0 ? ((totalCustomers - activeCustomers) / totalCustomers) * 100 : 0;

    return {
      customer_satisfaction_score: Math.round(averageRating * 100) / 100,
      net_promoter_score: 0, // Would need NPS survey data
      customer_acquisition_cost: 0, // Would need marketing spend data
      customer_lifetime_value: 0, // Would need transaction data
      churn_rate: Math.round(churnRate * 100) / 100,
      repeat_visit_rate: Math.round(repeatVisitRate * 100) / 100,
      average_session_duration: 0, // Would need session tracking
      conversion_rate: 0 // Would need conversion funnel data
    };
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    throw new Error('Failed to fetch business metrics');
  }
}

// =====================================================
// COMPREHENSIVE ANALYTICS DASHBOARD
// =====================================================

export async function getComprehensiveAnalytics() {
  try {
    const [
      customerAnalytics,
      visitAnalytics,
      rewardAnalytics,
      staffAnalytics,
      businessMetrics
    ] = await Promise.all([
      getCustomerAnalytics(),
      getVisitAnalytics(),
      getRewardAnalytics(),
      getStaffAnalytics(),
      getBusinessMetrics()
    ]);

    return {
      customer: customerAnalytics,
      visits: visitAnalytics,
      rewards: rewardAnalytics,
      staff: staffAnalytics,
      business: businessMetrics,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    throw new Error('Failed to fetch comprehensive analytics');
  }
}

// =====================================================
// EXPORT ANALYTICS
// =====================================================

export async function exportAnalyticsToCSV(analyticsType: 'customer' | 'visits' | 'rewards' | 'staff' | 'comprehensive') {
  try {
    let data: any;

    switch (analyticsType) {
      case 'customer':
        data = await getCustomerAnalytics();
        break;
      case 'visits':
        data = await getVisitAnalytics();
        break;
      case 'rewards':
        data = await getRewardAnalytics();
        break;
      case 'staff':
        data = await getStaffAnalytics();
        break;
      case 'comprehensive':
        data = await getComprehensiveAnalytics();
        break;
    }

    // Convert to CSV format (simplified)
    const csvContent = JSON.stringify(data, null, 2);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analyticsType}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${analyticsType} analytics exported successfully`);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    toast.error('Failed to export analytics');
  }
} 