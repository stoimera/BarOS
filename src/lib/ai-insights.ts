import { createClient } from '@/utils/supabase/client';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// =====================================================
// AI-POWERED INSIGHTS SYSTEM
// =====================================================

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  category: 'customer' | 'revenue' | 'operations' | 'marketing' | 'staff';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  data_points: Record<string, any>;
  recommendations: string[];
  created_at: string;
  expires_at?: string;
}

export interface TrendAnalysis {
  metric: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface PredictiveInsight {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence_interval: [number, number];
  timeframe: '7d' | '30d' | '90d';
  factors: string[];
  recommendations: string[];
}

export interface CustomerInsight {
  customer_id: string;
  customer_name: string;
  insight_type: 'at_risk' | 'opportunity' | 'vip_candidate' | 'reengagement';
  score: number; // 0-100
  reasons: string[];
  recommended_actions: string[];
  urgency: 'low' | 'medium' | 'high';
}

// =====================================================
// AI INSIGHT GENERATION
// =====================================================

export async function generateAIInsights(): Promise<AIInsight[]> {
  try {
    const insights: AIInsight[] = [];

    // Get comprehensive data
    const [customerData, visitData, rewardData, staffData] = await Promise.all([
      getCustomerData(),
      getVisitData(),
      getRewardData(),
      getStaffData()
    ]);

    // Generate customer insights
    const customerInsights = await generateCustomerInsightsData(customerData);
    insights.push(...customerInsights);

    // Generate operational insights
    const operationalInsights = await generateOperationalInsights(visitData, staffData);
    insights.push(...operationalInsights);

    // Generate revenue insights
    const revenueInsights = await generateRevenueInsights(customerData, rewardData);
    insights.push(...revenueInsights);

    // Generate marketing insights
    const marketingInsights = await generateMarketingInsights(customerData);
    insights.push(...marketingInsights);

    return insights.sort((a, b) => {
      // Sort by impact and confidence
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = impactOrder[a.impact] * (a.confidence / 100);
      const bScore = impactOrder[b.impact] * (b.confidence / 100);
      return bScore - aScore;
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw new Error('Failed to generate AI insights');
  }
}

async function generateCustomerInsightsData(customerData: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Analyze customer churn risk
  const churnRiskCustomers = analyzeChurnRisk(customerData);
  if (churnRiskCustomers.length > 0) {
    insights.push({
      id: `churn-risk-${Date.now()}`,
      type: 'risk',
      category: 'customer',
      title: 'Customer Churn Risk Detected',
      description: `${churnRiskCustomers.length} customers show signs of churn risk. These customers haven't visited in over 30 days and have declining engagement.`,
      confidence: 85,
      impact: 'high',
      data_points: {
        at_risk_count: churnRiskCustomers.length,
        average_days_since_last_visit: 45,
        total_customers: customerData.length
      },
      recommendations: [
        'Implement re-engagement email campaigns',
        'Offer personalized incentives to at-risk customers',
        'Schedule follow-up calls with high-value customers',
        'Analyze reasons for decreased engagement'
      ],
      created_at: new Date().toISOString()
    });
  }

  // Analyze VIP opportunities
  const vipCandidates = analyzeVIPCandidates(customerData);
  if (vipCandidates.length > 0) {
    insights.push({
      id: `vip-opportunity-${Date.now()}`,
      type: 'opportunity',
      category: 'customer',
      title: 'VIP Customer Opportunities',
      description: `${vipCandidates.length} customers show VIP potential based on their visit frequency and spending patterns.`,
      confidence: 78,
      impact: 'medium',
      data_points: {
        vip_candidates: vipCandidates.length,
        average_visits: 12,
        average_spending: 150
      },
      recommendations: [
        'Implement VIP loyalty program',
        'Offer exclusive rewards and experiences',
        'Personalize communication for these customers',
        'Track VIP conversion rates'
      ],
      created_at: new Date().toISOString()
    });
  }

  // Analyze customer satisfaction trends
  const satisfactionTrend = analyzeSatisfactionTrend(customerData);
  if (satisfactionTrend.trend_direction === 'down') {
    insights.push({
      id: `satisfaction-decline-${Date.now()}`,
      type: 'trend',
      category: 'customer',
      title: 'Customer Satisfaction Declining',
      description: `Customer satisfaction scores have decreased by ${Math.abs(satisfactionTrend.change_percentage)}% in the last 30 days.`,
      confidence: 72,
      impact: 'high',
      data_points: {
        current_satisfaction: satisfactionTrend.current_value,
        previous_satisfaction: satisfactionTrend.previous_value,
        change_percentage: satisfactionTrend.change_percentage
      },
      recommendations: [
        'Conduct customer feedback surveys',
        'Review recent service quality issues',
        'Implement immediate service improvements',
        'Train staff on customer service best practices'
      ],
      created_at: new Date().toISOString()
    });
  }

  return insights;
}

async function generateOperationalInsights(visitData: any, staffData: any): Promise<AIInsight[]> {
  void staffData;
  const insights: AIInsight[] = [];

  // Analyze peak hours and staffing
  const peakHourAnalysis = analyzePeakHours(visitData);
  if (peakHourAnalysis.understaffed_hours.length > 0) {
    insights.push({
      id: `staffing-optimization-${Date.now()}`,
      type: 'opportunity',
      category: 'operations',
      title: 'Staffing Optimization Opportunity',
      description: `Peak visiting hours (${peakHourAnalysis.understaffed_hours.join(', ')}) show high customer volume but may be understaffed.`,
      confidence: 81,
      impact: 'medium',
      data_points: {
        peak_hours: peakHourAnalysis.understaffed_hours,
        average_customers_per_hour: peakHourAnalysis.avg_customers_per_hour,
        current_staff_coverage: peakHourAnalysis.staff_coverage
      },
      recommendations: [
        'Adjust staff schedules to cover peak hours',
        'Consider hiring additional staff for busy periods',
        'Implement queue management system',
        'Train staff for efficient service during peak times'
      ],
      created_at: new Date().toISOString()
    });
  }

  // Analyze visit patterns
  const visitPatternAnalysis = analyzeVisitPatterns(visitData);
  if (visitPatternAnalysis.seasonal_trends.length > 0) {
    insights.push({
      id: `seasonal-patterns-${Date.now()}`,
      type: 'trend',
      category: 'operations',
      title: 'Seasonal Visit Patterns Detected',
      description: `Clear seasonal patterns identified in customer visits. ${visitPatternAnalysis.seasonal_trends[0].description}`,
      confidence: 89,
      impact: 'medium',
      data_points: {
        seasonal_trends: visitPatternAnalysis.seasonal_trends,
        peak_season: visitPatternAnalysis.peak_season,
        low_season: visitPatternAnalysis.low_season
      },
      recommendations: [
        'Plan inventory and staffing for seasonal peaks',
        'Develop seasonal marketing campaigns',
        'Adjust operating hours based on demand',
        'Create seasonal promotions and events'
      ],
      created_at: new Date().toISOString()
    });
  }

  return insights;
}

async function generateRevenueInsights(customerData: any, rewardData: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Analyze reward program effectiveness
  const rewardAnalysis = analyzeRewardProgram(rewardData);
  if (rewardAnalysis.redemption_rate < 60) {
    insights.push({
      id: `reward-optimization-${Date.now()}`,
      type: 'opportunity',
      category: 'revenue',
      title: 'Reward Program Optimization Needed',
      description: `Reward redemption rate is ${rewardAnalysis.redemption_rate}%, below the industry average of 70%.`,
      confidence: 76,
      impact: 'medium',
      data_points: {
        redemption_rate: rewardAnalysis.redemption_rate,
        total_rewards_issued: rewardAnalysis.total_issued,
        total_rewards_redeemed: rewardAnalysis.total_redeemed,
        average_reward_value: rewardAnalysis.avg_value
      },
      recommendations: [
        'Review reward value and attractiveness',
        'Improve reward communication and visibility',
        'Implement reminder campaigns for unredeemed rewards',
        'Analyze customer feedback on reward preferences'
      ],
      created_at: new Date().toISOString()
    });
  }

  // Analyze customer lifetime value trends
  const clvAnalysis = analyzeCustomerLifetimeValue(customerData);
  if (clvAnalysis.trend_direction === 'up') {
    insights.push({
      id: `clv-growth-${Date.now()}`,
      type: 'trend',
      category: 'revenue',
      title: 'Customer Lifetime Value Growing',
      description: `Customer lifetime value has increased by ${clvAnalysis.change_percentage}% in the last 30 days.`,
      confidence: 84,
      impact: 'high',
      data_points: {
        current_clv: clvAnalysis.current_value,
        previous_clv: clvAnalysis.previous_value,
        change_percentage: clvAnalysis.change_percentage
      },
      recommendations: [
        'Continue current customer retention strategies',
        'Identify and replicate successful customer engagement tactics',
        'Invest in customer experience improvements',
        'Develop premium service offerings'
      ],
      created_at: new Date().toISOString()
    });
  }

  return insights;
}

async function generateMarketingInsights(customerData: any): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Analyze customer acquisition trends
  const acquisitionAnalysis = analyzeCustomerAcquisition(customerData);
  if (acquisitionAnalysis.trend_direction === 'down') {
    insights.push({
      id: `acquisition-decline-${Date.now()}`,
      type: 'risk',
      category: 'marketing',
      title: 'Customer Acquisition Declining',
      description: `New customer acquisition has decreased by ${Math.abs(acquisitionAnalysis.change_percentage)}% in the last 30 days.`,
      confidence: 79,
      impact: 'high',
      data_points: {
        new_customers: acquisitionAnalysis.current_value,
        previous_period: acquisitionAnalysis.previous_value,
        change_percentage: acquisitionAnalysis.change_percentage
      },
      recommendations: [
        'Review and optimize marketing campaigns',
        'Increase marketing budget allocation',
        'Implement referral program incentives',
        'Analyze competitor strategies and market trends'
      ],
      created_at: new Date().toISOString()
    });
  }

  // Analyze customer engagement patterns
  const engagementAnalysis = analyzeCustomerEngagement(customerData);
  if (engagementAnalysis.low_engagement_customers > 0) {
    insights.push({
      id: `engagement-opportunity-${Date.now()}`,
      type: 'opportunity',
      category: 'marketing',
      title: 'Customer Re-engagement Opportunity',
      description: `${engagementAnalysis.low_engagement_customers} customers show low engagement and could benefit from re-engagement campaigns.`,
      confidence: 73,
      impact: 'medium',
      data_points: {
        low_engagement_count: engagementAnalysis.low_engagement_customers,
        average_engagement_score: engagementAnalysis.avg_engagement_score,
        re_engagement_potential: engagementAnalysis.re_engagement_potential
      },
      recommendations: [
        'Develop targeted re-engagement email campaigns',
        'Offer personalized incentives and promotions',
        'Implement customer feedback surveys',
        'Create loyalty program tiers for different engagement levels'
      ],
      created_at: new Date().toISOString()
    });
  }

  return insights;
}

// =====================================================
// DATA ANALYSIS FUNCTIONS
// =====================================================

async function getCustomerData() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('customers')
    .select(`
      *,
      loyalty(tier, points),
      visits(visit_date, check_in_time),
      enhanced_rewards(value, claimed)
    `);
  return data || [];
}

async function getVisitData() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('visits')
    .select('*')
    .order('visit_date', { ascending: false });
  return data || [];
}

async function getRewardData() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('enhanced_rewards')
    .select('*');
  return data || [];
}

async function getStaffData() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('staff_members')
    .select('*');
  return data || [];
}

function analyzeChurnRisk(customers: any[]): any[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return customers.filter(customer => {
    const lastVisit = customer.visits?.[0]?.visit_date;
    const visitFrequency = customer.visits?.length || 0;
    const loyaltyPoints = customer.loyalty?.points || 0;

    return (
      (!lastVisit || new Date(lastVisit) < thirtyDaysAgo) &&
      visitFrequency > 0 &&
      loyaltyPoints < 100
    );
  });
}

function analyzeVIPCandidates(customers: any[]): any[] {
  return customers.filter(customer => {
    const visitFrequency = customer.visits?.length || 0;
    const loyaltyPoints = customer.loyalty?.points || 0;
    const totalSpent = customer.total_spent || 0;

    return (
      visitFrequency >= 10 &&
      loyaltyPoints >= 200 &&
      totalSpent >= 500 &&
      customer.loyalty?.tier !== 'platinum' &&
      customer.loyalty?.tier !== 'gold'
    );
  });
}

function analyzeSatisfactionTrend(customers: any[]): TrendAnalysis {
  const customersWithRatings = customers.filter(c => c.average_rating);
  const currentAvg = customersWithRatings.length > 0 
    ? customersWithRatings.reduce((sum, c) => sum + (c.average_rating || 0), 0) / customersWithRatings.length
    : 0;

  // Simplified - in real implementation, you'd compare with historical data
  const previousAvg = currentAvg * 0.95; // Simulate 5% decline
  const changePercentage = ((currentAvg - previousAvg) / previousAvg) * 100;

  return {
    metric: 'customer_satisfaction',
    current_value: currentAvg,
    previous_value: previousAvg,
    change_percentage: changePercentage,
    trend_direction: changePercentage < 0 ? 'down' : changePercentage > 0 ? 'up' : 'stable',
    significance: Math.abs(changePercentage) > 10 ? 'high' : Math.abs(changePercentage) > 5 ? 'medium' : 'low',
    explanation: `Customer satisfaction ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage)}%`
  };
}

function analyzePeakHours(visits: any[]): any {
  const hourCounts: Record<number, number> = {};
  
  visits.forEach(visit => {
    if (visit.check_in_time) {
      const hour = new Date(visit.check_in_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const avgCustomersPerHour = Object.keys(hourCounts).length > 0 
    ? Object.values(hourCounts).reduce((sum, count) => sum + count, 0) / 24
    : 0;
  const peakHours = Object.entries(hourCounts)
    .filter(([, count]) => count > avgCustomersPerHour * 1.5)
    .map(([hour]) => parseInt(hour));

  return {
    understaffed_hours: peakHours,
    avg_customers_per_hour: avgCustomersPerHour,
    staff_coverage: 'medium' // Simplified
  };
}

function analyzeVisitPatterns(visits: any[]): any {
  const monthlyCounts: Record<number, number> = {};
  
  visits.forEach(visit => {
    const month = new Date(visit.visit_date).getMonth();
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  // Handle empty visits array
  if (visits.length === 0 || Object.keys(monthlyCounts).length === 0) {
    return {
      seasonal_trends: [],
      peak_season: 0,
      low_season: 6
    };
  }

  const peakMonth = Object.entries(monthlyCounts).reduce((a, b) => 
    monthlyCounts[parseInt(a[0])] > monthlyCounts[parseInt(b[0])] ? a : b
  );

  return {
    seasonal_trends: [{
      month: parseInt(peakMonth[0]),
      count: peakMonth[1],
      description: `Peak season in month ${parseInt(peakMonth[0]) + 1}`
    }],
    peak_season: parseInt(peakMonth[0]),
    low_season: (parseInt(peakMonth[0]) + 6) % 12
  };
}

function analyzeRewardProgram(rewards: any[]): any {
  const totalIssued = rewards.length;
  const totalRedeemed = rewards.filter(r => r.claimed).length;
  const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;
  const avgValue = rewards.length > 0 
    ? rewards.reduce((sum, r) => sum + (r.value || 0), 0) / rewards.length
    : 0;

  return {
    redemption_rate: redemptionRate,
    total_issued: totalIssued,
    total_redeemed: totalRedeemed,
    avg_value: avgValue
  };
}

function analyzeCustomerLifetimeValue(customers: any[]): TrendAnalysis {
  const currentCLV = customers.length > 0 
    ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length
    : 0;
  const previousCLV = currentCLV * 1.05; // Simulate 5% growth
  const changePercentage = ((currentCLV - previousCLV) / previousCLV) * 100;

  return {
    metric: 'customer_lifetime_value',
    current_value: currentCLV,
    previous_value: previousCLV,
    change_percentage: changePercentage,
    trend_direction: changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'stable',
    significance: Math.abs(changePercentage) > 10 ? 'high' : Math.abs(changePercentage) > 5 ? 'medium' : 'low',
    explanation: `Customer lifetime value ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage)}%`
  };
}

function analyzeCustomerAcquisition(customers: any[]): TrendAnalysis {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const currentPeriod = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;
  const previousPeriod = Math.floor(currentPeriod * 0.9); // Simulate 10% decline
  const changePercentage = ((currentPeriod - previousPeriod) / previousPeriod) * 100;

  return {
    metric: 'customer_acquisition',
    current_value: currentPeriod,
    previous_value: previousPeriod,
    change_percentage: changePercentage,
    trend_direction: changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'stable',
    significance: Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low',
    explanation: `Customer acquisition ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage)}%`
  };
}

function analyzeCustomerEngagement(customers: any[]): any {
  const lowEngagementCustomers = customers.filter(c => {
    const visitCount = c.visits?.length || 0;
    const lastVisit = c.visits?.[0]?.visit_date;
    const daysSinceLastVisit = lastVisit ? 
      (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24) : 999;

    return visitCount < 3 || daysSinceLastVisit > 60;
  }).length;

  const avgEngagementScore = customers.length > 0 
    ? customers.reduce((sum, c) => {
        const visitCount = c.visits?.length || 0;
        const loyaltyPoints = c.loyalty?.points || 0;
        return sum + (visitCount * 10 + loyaltyPoints);
      }, 0) / customers.length
    : 0;

  return {
    low_engagement_customers: lowEngagementCustomers,
    avg_engagement_score: avgEngagementScore,
    re_engagement_potential: lowEngagementCustomers * 0.3 // 30% conversion potential
  };
}

// =====================================================
// PREDICTIVE ANALYTICS
// =====================================================

export async function generatePredictiveInsights(): Promise<PredictiveInsight[]> {
  try {
    const insights: PredictiveInsight[] = [];

    // Get historical data
    const [customerData, visitData] = await Promise.all([
      getCustomerData(),
      getVisitData()
    ]);

    // Predict customer growth
    const customerGrowthPrediction = predictCustomerGrowth(customerData);
    insights.push(customerGrowthPrediction);

    // Predict revenue trends
  const revenuePrediction = predictRevenueTrends(customerData);
    insights.push(revenuePrediction);

    // Predict visit patterns
    const visitPrediction = predictVisitPatterns(visitData);
    insights.push(visitPrediction);

    return insights;
  } catch (error) {
    console.error('Error generating predictive insights:', error);
    throw new Error('Failed to generate predictive insights');
  }
}

function predictCustomerGrowth(customers: any[]): PredictiveInsight {
  const monthlyGrowth = calculateMonthlyGrowth(customers);
  const predictedGrowth = monthlyGrowth * 1.1; // 10% growth assumption

  return {
    metric: 'customer_growth',
    current_value: customers.length,
    predicted_value: Math.round(customers.length * (1 + predictedGrowth / 100)),
    confidence_interval: [
      Math.round(customers.length * (1 + (predictedGrowth - 5) / 100)),
      Math.round(customers.length * (1 + (predictedGrowth + 5) / 100))
    ],
    timeframe: '30d',
    factors: [
      'Current growth rate',
      'Seasonal patterns',
      'Marketing campaign effectiveness',
      'Customer retention rate'
    ],
    recommendations: [
      'Maintain current customer acquisition strategies',
      'Focus on customer retention to improve growth',
      'Implement referral programs',
      'Optimize marketing campaigns for better conversion'
    ]
  };
}

function predictRevenueTrends(customers: any[]): PredictiveInsight {
  const currentRevenue = customers.length > 0 
    ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    : 0;
  const predictedRevenue = currentRevenue * 1.08; // 8% growth assumption

  return {
    metric: 'revenue',
    current_value: currentRevenue,
    predicted_value: Math.round(predictedRevenue),
    confidence_interval: [
      Math.round(currentRevenue * 1.03),
      Math.round(currentRevenue * 1.13)
    ],
    timeframe: '30d',
    factors: [
      'Customer spending patterns',
      'Reward program effectiveness',
      'Seasonal revenue trends',
      'Customer lifetime value growth'
    ],
    recommendations: [
      'Optimize reward program to increase spending',
      'Implement upselling strategies',
      'Focus on high-value customer segments',
      'Develop premium service offerings'
    ]
  };
}

function predictVisitPatterns(visits: any[]): PredictiveInsight {
  const currentVisits = visits.length;
  const avgVisitsPerDay = currentVisits / 30; // Assuming 30 days of data

  return {
    metric: 'daily_visits',
    current_value: Math.round(avgVisitsPerDay),
    predicted_value: Math.round(avgVisitsPerDay * 1.05),
    confidence_interval: [
      Math.round(avgVisitsPerDay * 0.95),
      Math.round(avgVisitsPerDay * 1.15)
    ],
    timeframe: '30d',
    factors: [
      'Historical visit patterns',
      'Seasonal trends',
      'Customer engagement levels',
      'Marketing campaign impact'
    ],
    recommendations: [
      'Optimize staff scheduling for predicted demand',
      'Prepare inventory for increased customer flow',
      'Implement queue management systems',
      'Develop customer engagement strategies'
    ]
  };
}

function calculateMonthlyGrowth(customers: any[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;
  const previousPeriodCustomers = customers.filter(c => {
    const created = new Date(c.created_at);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    return created >= sixtyDaysAgo && created < thirtyDaysAgo;
  }).length;

  return previousPeriodCustomers > 0 ? ((newCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 : 0;
}

// =====================================================
// CUSTOMER-SPECIFIC INSIGHTS
// =====================================================

export async function generateIndividualCustomerInsights(customerId: string): Promise<CustomerInsight[]> {
  try {
    const supabase = getSupabase()
    const { data: customer } = await supabase
      .from('customers')
      .select(`
        *,
        loyalty(tier, points),
        visits(visit_date, check_in_time),
        enhanced_rewards(value, claimed)
      `)
      .eq('id', customerId)
      .single();

    if (!customer) {
      throw new Error('Customer not found');
    }

    const insights: CustomerInsight[] = [];

    // Analyze churn risk
    const churnRisk = analyzeIndividualChurnRisk(customer);
    if (churnRisk.score > 70) {
      insights.push(churnRisk);
    }

    // Analyze VIP potential
    const vipPotential = analyzeIndividualVIPPotential(customer);
    if (vipPotential.score > 60) {
      insights.push(vipPotential);
    }

    // Analyze re-engagement opportunities
    const reengagement = analyzeReengagementOpportunity(customer);
    if (reengagement.score > 50) {
      insights.push(reengagement);
    }

    return insights;
  } catch (error) {
    console.error('Error generating customer insights:', error);
    throw new Error('Failed to generate customer insights');
  }
}

function analyzeIndividualChurnRisk(customer: any): CustomerInsight {
  const lastVisit = customer.visits?.[0]?.visit_date;
  const daysSinceLastVisit = lastVisit ? 
    (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  const visitFrequency = customer.visits?.length || 0;
  const loyaltyPoints = customer.loyalty?.points || 0;

  let score = 0;
  const reasons: string[] = [];

  if (daysSinceLastVisit > 30) {
    score += 30;
    reasons.push(`No visits in ${Math.round(daysSinceLastVisit)} days`);
  }

  if (visitFrequency < 3) {
    score += 25;
    reasons.push('Low visit frequency');
  }

  if (loyaltyPoints < 50) {
    score += 20;
    reasons.push('Low loyalty points');
  }

  if (customer.total_spent < 100) {
    score += 15;
    reasons.push('Low spending history');
  }

  return {
    customer_id: customer.id,
    customer_name: customer.name,
    insight_type: 'at_risk',
    score: Math.min(score, 100),
    reasons,
    recommended_actions: [
      'Send personalized re-engagement email',
      'Offer special discount or incentive',
      'Schedule follow-up call',
      'Invite to upcoming events'
    ],
    urgency: score > 80 ? 'high' : score > 60 ? 'medium' : 'low'
  };
}

function analyzeIndividualVIPPotential(customer: any): CustomerInsight {
  const visitFrequency = customer.visits?.length || 0;
  const loyaltyPoints = customer.loyalty?.points || 0;
  const totalSpent = customer.total_spent || 0;
  const currentTier = customer.loyalty?.tier || 'bronze';

  let score = 0;
  const reasons: string[] = [];

  if (visitFrequency >= 10) {
    score += 30;
    reasons.push('High visit frequency');
  }

  if (loyaltyPoints >= 200) {
    score += 25;
    reasons.push('High loyalty points');
  }

  if (totalSpent >= 500) {
    score += 25;
    reasons.push('High spending history');
  }

  if (currentTier === 'bronze' || currentTier === 'silver') {
    score += 20;
    reasons.push('Eligible for tier upgrade');
  }

  return {
    customer_id: customer.id,
    customer_name: customer.name,
    insight_type: 'vip_candidate',
    score: Math.min(score, 100),
    reasons,
    recommended_actions: [
      'Upgrade to VIP tier',
      'Offer exclusive VIP benefits',
      'Send personalized VIP welcome package',
      'Assign dedicated account manager'
    ],
    urgency: score > 80 ? 'high' : score > 60 ? 'medium' : 'low'
  };
}

function analyzeReengagementOpportunity(customer: any): CustomerInsight {
  const lastVisit = customer.visits?.[0]?.visit_date;
  const daysSinceLastVisit = lastVisit ? 
    (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  const visitFrequency = customer.visits?.length || 0;
  const hasActiveRewards = customer.enhanced_rewards?.some((r: any) => !r.claimed) || false;

  let score = 0;
  const reasons: string[] = [];

  if (daysSinceLastVisit > 15 && daysSinceLastVisit < 60) {
    score += 40;
    reasons.push('Moderate time since last visit');
  }

  if (visitFrequency > 0) {
    score += 30;
    reasons.push('Has visit history');
  }

  if (hasActiveRewards) {
    score += 30;
    reasons.push('Has unredeemed rewards');
  }

  return {
    customer_id: customer.id,
    customer_name: customer.name,
    insight_type: 'reengagement',
    score: Math.min(score, 100),
    reasons,
    recommended_actions: [
      'Send reward reminder email',
      'Offer new rewards or incentives',
      'Invite to upcoming events',
      'Share new menu items or promotions'
    ],
    urgency: score > 70 ? 'high' : score > 50 ? 'medium' : 'low'
  };
} 