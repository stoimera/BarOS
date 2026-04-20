import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { Resend } from 'resend'

// =====================================================
// EMAIL MARKETING SYSTEM
// =====================================================

// Email campaign interface
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  segment_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  opened_count: number;
  clicked_count: number;
  unsubscribed_count: number;
  created_at: string;
  updated_at: string;
}

// Email template interface
export interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  content_template: string;
  variables: string[];
  category: 'welcome' | 'birthday' | 'reward' | 'promotional' | 'newsletter' | 'custom';
  enabled: boolean;
  created_at: string;
}

// Email segment interface
export interface EmailSegment {
  id: string;
  name: string;
  description: string;
  filters: {
    loyalty_tier?: string[];
    visit_frequency?: 'low' | 'medium' | 'high';
    last_visit_days?: number;
    has_birthday_this_month?: boolean;
    has_active_rewards?: boolean;
    tags?: string[];
  };
  customer_count: number;
  created_at: string;
}

// Email subscriber interface
export interface EmailSubscriber {
  id: string;
  customer_id: string;
  email: string;
  subscribed: boolean;
  preferences: {
    welcome_emails: boolean;
    birthday_emails: boolean;
    reward_emails: boolean;
    promotional_emails: boolean;
    newsletter: boolean;
  };
  unsubscribed_at?: string;
  created_at: string;
}

// Initialize Resend client
function getResendClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Resend client should not be used on the client');
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables');
  }
  return new Resend(apiKey);
}

// =====================================================
// EMAIL CAMPAIGN MANAGEMENT
// =====================================================

export async function createEmailCampaign(data: {
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  segment_id?: string;
  scheduled_at?: string;
}): Promise<EmailCampaign> {
  const supabase = await createServiceRoleClient()
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .insert([{
      ...data,
      status: 'draft',
      total_recipients: 0,
      opened_count: 0,
      clicked_count: 0,
      unsubscribed_count: 0
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating email campaign:', error);
    throw new Error('Failed to create email campaign');
  }

  return campaign;
}

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email campaigns:', error);
    throw new Error('Failed to fetch email campaigns');
  }

  return data || [];
}

export async function updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email campaign:', error);
    throw new Error('Failed to update email campaign');
  }

  return data;
}

export async function deleteEmailCampaign(id: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting email campaign:', error);
    throw new Error('Failed to delete email campaign');
  }
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

export async function createEmailTemplate(data: {
  name: string;
  subject_template: string;
  content_template: string;
  variables: string[];
  category: EmailTemplate['category'];
}): Promise<EmailTemplate> {
  const supabase = await createServiceRoleClient()
  const { data: template, error } = await supabase
    .from('email_templates')
    .insert([{
      ...data,
      enabled: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating email template:', error);
    throw new Error('Failed to create email template');
  }

  return template;
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email templates:', error);
    throw new Error('Failed to fetch email templates');
  }

  return data || [];
}

export async function generateEmailFromTemplate(
  templateId: string,
  variables: Record<string, string>
): Promise<{ subject: string; content: string }> {
  const supabase = await createServiceRoleClient()
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    throw new Error('Email template not found');
  }

  let subject = template.subject_template;
  let content = template.content_template;

  // Replace variables in templates
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, content };
}

// =====================================================
// EMAIL SEGMENTS
// =====================================================

export async function createEmailSegment(data: {
  name: string;
  description: string;
  filters: EmailSegment['filters'];
}): Promise<EmailSegment> {
  const customerCount = await calculateSegmentSize(data.filters);

  const supabase = await createServiceRoleClient()
  const { data: segment, error } = await supabase
    .from('email_segments')
    .insert([{
      ...data,
      customer_count: customerCount
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating email segment:', error);
    throw new Error('Failed to create email segment');
  }

  return segment;
}

export async function getEmailSegments(): Promise<EmailSegment[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_segments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email segments:', error);
    throw new Error('Failed to fetch email segments');
  }

  return data || [];
}

async function calculateSegmentSize(filters: EmailSegment['filters']): Promise<number> {
  const supabase = await createServiceRoleClient()
  let query = supabase
    .from('customers')
    .select('id', { count: 'exact' });

  // Apply filters
  if (filters.loyalty_tier && filters.loyalty_tier.length > 0) {
    query = query.in('loyalty_tier', filters.loyalty_tier);
  }

  if (filters.visit_frequency) {
    // This would be implemented with more complex queries
    // For now, returning a placeholder
  }

  if (filters.last_visit_days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.last_visit_days);
    query = query.gte('last_visit', cutoffDate.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error calculating segment size:', error);
    return 0;
  }

  return count || 0;
}

// =====================================================
// AUTOMATED EMAIL TRIGGERS
// =====================================================

export async function sendWelcomeEmail(customerId: string, customerName: string, customerEmail: string): Promise<void> {
  try {
    const templates = await getEmailTemplates();
    const welcomeTemplate = templates.find(t => t.category === 'welcome');

    if (!welcomeTemplate) {
      console.warn('Welcome email template not found');
      return;
    }

    const { subject, content } = await generateEmailFromTemplate(welcomeTemplate.id, {
      customer_name: customerName,
      signup_date: new Date().toLocaleDateString()
    });

    // Create campaign for this customer
    await createEmailCampaign({
      name: `Welcome Email - ${customerName}`,
      subject,
      content,
      template_id: welcomeTemplate.id
    });

    // Send the actual email using Resend
    const { error } = await getResendClient().emails.send({
      from: 'noreply@urbanlounge.com',
      to: customerEmail,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }

    console.log('Welcome email sent successfully to:', customerEmail);

  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

export async function sendBirthdayEmail(customerId: string, customerName: string, customerEmail: string): Promise<void> {
  try {
    const templates = await getEmailTemplates();
    const birthdayTemplate = templates.find(t => t.category === 'birthday');

    if (!birthdayTemplate) {
      console.warn('Birthday email template not found');
      return;
    }

    const { subject, content } = await generateEmailFromTemplate(birthdayTemplate.id, {
      customer_name: customerName,
      birthday_date: new Date().toLocaleDateString()
    });

    await createEmailCampaign({
      name: `Birthday Email - ${customerName}`,
      subject,
      content,
      template_id: birthdayTemplate.id
    });

    // Send the actual email using Resend
    const { error } = await getResendClient().emails.send({
      from: 'noreply@urbanlounge.com',
      to: customerEmail,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (error) {
      console.error('Failed to send birthday email:', error);
      throw new Error('Failed to send birthday email');
    }

    console.log('Birthday email sent successfully to:', customerEmail);

  } catch (error) {
    console.error('Error sending birthday email:', error);
  }
}

export async function sendRewardEmail(customerId: string, customerName: string, customerEmail: string, rewardType: string): Promise<void> {
  try {
    const templates = await getEmailTemplates();
    const rewardTemplate = templates.find(t => t.category === 'reward');

    if (!rewardTemplate) {
      console.warn('Reward email template not found');
      return;
    }

    const { subject, content } = await generateEmailFromTemplate(rewardTemplate.id, {
      customer_name: customerName,
      reward_type: rewardType,
      reward_date: new Date().toLocaleDateString()
    });

    await createEmailCampaign({
      name: `Reward Email - ${customerName}`,
      subject,
      content,
      template_id: rewardTemplate.id
    });

    // Send the actual email using Resend
    const { error } = await getResendClient().emails.send({
      from: 'noreply@urbanlounge.com',
      to: customerEmail,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (error) {
      console.error('Failed to send reward email:', error);
      throw new Error('Failed to send reward email');
    }

    console.log('Reward email sent successfully to:', customerEmail);

  } catch (error) {
    console.error('Error sending reward email:', error);
  }
}

// =====================================================
// EMAIL SUBSCRIBER MANAGEMENT
// =====================================================

export async function subscribeCustomer(customerId: string, email: string): Promise<EmailSubscriber> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_subscribers')
    .upsert([{
      customer_id: customerId,
      email,
      subscribed: true,
      preferences: {
        welcome_emails: true,
        birthday_emails: true,
        reward_emails: true,
        promotional_emails: true,
        newsletter: true
      }
    }])
    .select()
    .single();

  if (error) {
    console.error('Error subscribing customer:', error);
    throw new Error('Failed to subscribe customer');
  }

  return data;
}

export async function unsubscribeCustomer(customerId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('email_subscribers')
    .update({
      subscribed: false,
      unsubscribed_at: new Date().toISOString()
    })
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error unsubscribing customer:', error);
    throw new Error('Failed to unsubscribe customer');
  }
}

export async function updateEmailPreferences(
  customerId: string,
  preferences: Partial<EmailSubscriber['preferences']>
): Promise<EmailSubscriber> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('email_subscribers')
    .update({ preferences })
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating email preferences:', error);
    throw new Error('Failed to update email preferences');
  }

  return data;
}

// =====================================================
// EMAIL ANALYTICS
// =====================================================

export async function getEmailAnalytics(): Promise<{
  total_campaigns: number;
  total_sent: number;
  average_open_rate: number;
  average_click_rate: number;
  campaigns_by_status: Array<{ status: string; count: number }>;
  top_performing_campaigns: Array<{ name: string; open_rate: number; click_rate: number }>;
}> {
  try {
    const campaigns = await getEmailCampaigns();

    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.filter(c => c.status === 'sent').length;
    
    const totalOpens = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.total_recipients, 0);

    const averageOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
    const averageClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0;

    // Group campaigns by status
    const statusCounts: Record<string, number> = {};
    campaigns.forEach(campaign => {
      statusCounts[campaign.status] = (statusCounts[campaign.status] || 0) + 1;
    });

    const campaignsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    // Get top performing campaigns
    const topPerforming = campaigns
      .filter(c => c.status === 'sent' && c.total_recipients > 0)
      .map(c => ({
        name: c.name,
        open_rate: c.total_recipients > 0 ? (c.opened_count / c.total_recipients) * 100 : 0,
        click_rate: c.total_recipients > 0 ? (c.clicked_count / c.total_recipients) * 100 : 0
      }))
      .sort((a, b) => b.open_rate - a.open_rate)
      .slice(0, 5);

    return {
      total_campaigns: totalCampaigns,
      total_sent: totalSent,
      average_open_rate: Math.round(averageOpenRate * 100) / 100,
      average_click_rate: Math.round(averageClickRate * 100) / 100,
      campaigns_by_status: campaignsByStatus,
      top_performing_campaigns: topPerforming
    };
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    throw new Error('Failed to fetch email analytics');
  }
}

// =====================================================
// AUTOMATED EMAIL SCHEDULING
// =====================================================

export async function scheduleAutomatedEmails(): Promise<void> {
  try {
    // Check for customers with birthdays today
    const today = new Date();
    const supabaseClient = await createServiceRoleClient()
    const { data: birthdayCustomers } = await supabaseClient
      .from('customers')
      .select('id, name, email, date_of_birth')
      .eq('EXTRACT(MONTH FROM date_of_birth)', today.getMonth() + 1)
      .eq('EXTRACT(DAY FROM date_of_birth)', today.getDate());

    // Send birthday emails
    for (const customer of birthdayCustomers || []) {
      if (customer.email) {
        await sendBirthdayEmail(customer.id, customer.name, customer.email);
      }
    }

    // Check for new customers (registered in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const supabaseClient2 = await createServiceRoleClient()
    const { data: newCustomers } = await supabaseClient2
      .from('customers')
      .select('id, name, email, created_at')
      .gte('created_at', yesterday.toISOString());

    // Send welcome emails
    for (const customer of newCustomers || []) {
      if (customer.email) {
        await sendWelcomeEmail(customer.id, customer.name, customer.email);
      }
    }


  } catch (error) {
    console.error('Error scheduling automated emails:', error);
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function getSubscriberCount(): Promise<number> {
  const supabase = await createServiceRoleClient()
  const { count, error } = await supabase
    .from('email_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('subscribed', true);

  if (error) {
    console.error('Error getting subscriber count:', error);
    return 0;
  }

  return count || 0;
}

export async function cleanupUnsubscribedUsers(): Promise<void> {
  const supabase = await createServiceRoleClient()
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('email_subscribers')
    .delete()
    .eq('subscribed', false)
    .lt('unsubscribed_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error cleaning up unsubscribed users:', error);
    throw new Error('Failed to cleanup unsubscribed users');
  }
} 