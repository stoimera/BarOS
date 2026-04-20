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
// GOOGLE REVIEW INTEGRATION
// =====================================================

export interface GoogleReviewPrompt {
  id: string;
  customer_id: string;
  visit_id: string;
  prompt_type: 'visit_satisfaction' | 'birthday' | 'milestone' | 'reward_claim';
  status: 'pending' | 'sent' | 'completed' | 'failed';
  sent_at?: string;
  completed_at?: string;
  review_rating?: number;
  review_text?: string;
  google_place_id?: string;
  created_at: string;
}

export interface GoogleReviewSettings {
  enabled: boolean;
  google_place_id: string;
  api_key: string;
  auto_prompt_enabled: boolean;
  prompt_delay_hours: number;
  min_rating_threshold: number;
  review_incentive_enabled: boolean;
  review_incentive_value: number;
}

// =====================================================
// REVIEW PROMPT MANAGEMENT
// =====================================================

export async function createReviewPrompt(data: {
  customer_id: string;
  visit_id: string;
  prompt_type: GoogleReviewPrompt['prompt_type'];
}): Promise<GoogleReviewPrompt> {
  const supabase = getSupabase();
  const { data: prompt, error } = await supabase
    .from('google_review_prompts')
    .insert([{
      customer_id: data.customer_id,
      visit_id: data.visit_id,
      prompt_type: data.prompt_type,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating review prompt:', error);
    throw new Error('Failed to create review prompt');
  }

  return prompt;
}

export async function getReviewPrompts(filters?: {
  customer_id?: string;
  visit_id?: string;
  status?: GoogleReviewPrompt['status'];
  prompt_type?: GoogleReviewPrompt['prompt_type'];
}): Promise<GoogleReviewPrompt[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('google_review_prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters?.visit_id) {
    query = query.eq('visit_id', filters.visit_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.prompt_type) {
    query = query.eq('prompt_type', filters.prompt_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching review prompts:', error);
    throw new Error('Failed to fetch review prompts');
  }

  return data || [];
}

export async function updateReviewPrompt(id: string, updates: Partial<GoogleReviewPrompt>): Promise<GoogleReviewPrompt> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('google_review_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating review prompt:', error);
    throw new Error('Failed to update review prompt');
  }

  return data;
}

// =====================================================
// AUTOMATED REVIEW PROMPTS
// =====================================================

export async function checkAndCreateReviewPrompts(): Promise<void> {
  try {
    const supabase = getSupabase();
    // Get settings
    const settings = await getGoogleReviewSettings();
    if (!settings.enabled || !settings.auto_prompt_enabled) {
      return;
    }

    // Get recent visits that haven't been prompted yet
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        customer_id,
        check_in_time,
        visit_date
      `)
      .gte('check_in_time', new Date(Date.now() - settings.prompt_delay_hours * 60 * 60 * 1000).toISOString())
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching recent visits:', error);
      return;
    }

    // Check each visit for existing prompts
    for (const visit of visits || []) {
      const existingPrompts = await getReviewPrompts({
        customer_id: visit.customer_id,
        visit_id: visit.id
      });

      if (existingPrompts.length === 0) {
        // Create review prompt
        await createReviewPrompt({
          customer_id: visit.customer_id,
          visit_id: visit.id,
          prompt_type: 'visit_satisfaction'
        });
      }
    }
  } catch (error) {
    console.error('Error checking for review prompts:', error);
  }
}

// =====================================================
// GOOGLE PLACES API INTEGRATION
// =====================================================

export async function getGooglePlaceDetails(placeId: string): Promise<any> {
  const settings = await getGoogleReviewSettings();
  
  if (!settings.api_key) {
    throw new Error('Google Places API key not configured');
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${settings.api_key}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google Place details');
  }

  const data = await response.json();
  return data.result;
}

export async function submitGoogleReview(data: {
  placeId: string;
  rating: number;
  text: string;
  customerName: string;
}): Promise<any> {
  // Note: Google Places API doesn't allow direct review submission via client-side
  // This would need to be handled server-side with proper authentication
  // For now, we'll simulate the submission
  void data;
  
  // In a real implementation, this would make a server-side API call
  // to submit the review to Google Places API
  
  return { success: true, review_id: 'mock_review_id' };
}

// =====================================================
// REVIEW INCENTIVES
// =====================================================

export async function createReviewIncentive(customerId: string, reviewPromptId: string): Promise<any> {
  void reviewPromptId;
  const settings = await getGoogleReviewSettings();
  
  if (!settings.review_incentive_enabled) {
    return null;
  }

  // Create a reward for leaving a review
  const { createEnhancedReward } = await import('./enhanced-rewards');
  const { RewardCategory } = await import('@/types/rewards');

  try {
    const reward = await createEnhancedReward({
      customer_id: customerId,
      category: RewardCategory.CUSTOM,
      description: `Review Incentive - $${settings.review_incentive_value} off your next visit`,
      value: settings.review_incentive_value,
      requires_age_verification: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return reward;
  } catch (error) {
    console.error('Error creating review incentive:', error);
    return null;
  }
}

// =====================================================
// SETTINGS MANAGEMENT
// =====================================================

export async function getGoogleReviewSettings(): Promise<GoogleReviewSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('google_review_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching Google review settings:', error);
    throw new Error('Failed to fetch Google review settings');
  }

  // Return default settings if none exist
  return data || {
    enabled: false,
    google_place_id: '',
    api_key: '',
    auto_prompt_enabled: false,
    prompt_delay_hours: 24,
    min_rating_threshold: 4,
    review_incentive_enabled: false,
    review_incentive_value: 5
  };
}

export async function updateGoogleReviewSettings(settings: Partial<GoogleReviewSettings>): Promise<GoogleReviewSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('google_review_settings')
    .upsert([settings])
    .select()
    .single();

  if (error) {
    console.error('Error updating Google review settings:', error);
    throw new Error('Failed to update Google review settings');
  }

  return data;
}

// =====================================================
// REVIEW ANALYTICS
// =====================================================

export async function getReviewAnalytics(): Promise<{
  total_prompts: number;
  sent_prompts: number;
  completed_reviews: number;
  average_rating: number;
  review_rate: number;
  prompts_by_type: Array<{ type: string; count: number }>;
  reviews_by_month: Array<{ month: string; count: number; avg_rating: number }>;
}> {
  const prompts = await getReviewPrompts();
  
  const totalPrompts = prompts.length;
  const sentPrompts = prompts.filter(p => p.status === 'sent').length;
  const completedReviews = prompts.filter(p => p.status === 'completed').length;
  
  const completedPromptData = prompts.filter(p => p.status === 'completed' && p.review_rating);
  const averageRating = completedPromptData.length > 0 
    ? completedPromptData.reduce((sum, p) => sum + (p.review_rating || 0), 0) / completedPromptData.length
    : 0;

  const reviewRate = totalPrompts > 0 ? (completedReviews / totalPrompts) * 100 : 0;

  // Group by prompt type
  const promptsByType = Object.entries(
    prompts.reduce((acc, prompt) => {
      acc[prompt.prompt_type] = (acc[prompt.prompt_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  // Group by month
  const reviewsByMonth = Object.entries(
    completedPromptData.reduce((acc, prompt) => {
      const month = new Date(prompt.completed_at!).toISOString().substr(0, 7);
      if (!acc[month]) {
        acc[month] = { count: 0, totalRating: 0 };
      }
      acc[month].count++;
      acc[month].totalRating += prompt.review_rating || 0;
      return acc;
    }, {} as Record<string, { count: number; totalRating: number }>)
  ).map(([month, data]) => ({
    month,
    count: data.count,
    avg_rating: data.count > 0 ? data.totalRating / data.count : 0
  }));

  return {
    total_prompts: totalPrompts,
    sent_prompts: sentPrompts,
    completed_reviews: completedReviews,
    average_rating: Math.round(averageRating * 100) / 100,
    review_rate: Math.round(reviewRate * 100) / 100,
    prompts_by_type: promptsByType,
    reviews_by_month: reviewsByMonth
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function sendReviewPrompt(customerId: string, promptId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', customerId)
      .single();

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get settings
    const settings = await getGoogleReviewSettings();
    
    // In a real implementation, this would send an email/SMS
    // For now, we'll just update the prompt status
    await updateReviewPrompt(promptId, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    // Create incentive if enabled
    if (settings.review_incentive_enabled) {
      await createReviewIncentive(customerId, promptId);
    }

    return true;
  } catch (error) {
    console.error('Error sending review prompt:', error);
    await updateReviewPrompt(promptId, { status: 'failed' });
    return false;
  }
}

export async function markReviewCompleted(promptId: string, rating: number, text?: string): Promise<void> {
  await updateReviewPrompt(promptId, {
    status: 'completed',
    review_rating: rating,
    review_text: text,
    completed_at: new Date().toISOString()
  });
} 