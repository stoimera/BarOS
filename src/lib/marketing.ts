import { createClientApiClient } from '@/utils/supabase/browser-client'
import { sendBulkMarketingCampaign } from './email'
import { 
  MarketingCampaign, 
  CampaignTemplate, 
  CampaignAnalytics, 
  AutomationWorkflow,
  CustomerSegment,
  CampaignSchedule,
  Newsletter,
  PromotionalMaterial,
  CreateCampaignData,
  CreateNewsletterData,
  CreatePromoMaterialData
} from '@/types/marketing'

interface MarketingAuthContext {
  userId: string
  role: string
}

async function checkUserAuth(): Promise<MarketingAuthContext> {
  const supabase = createClientApiClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()

  if (authError || !userData.user) {
    throw new Error('Authentication required')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single()

  if (profileError || !profile?.role) {
    throw new Error('Unable to resolve user role')
  }

  return {
    userId: userData.user.id,
    role: profile.role,
  }
}

function assertMarketingWriteAccess(role: string): void {
  if (!['staff', 'admin'].includes(role)) {
    throw new Error('Insufficient permissions for marketing operation')
  }
}

// Helper function to ensure storage bucket exists
async function ensureStorageBucket(bucketName: string): Promise<void> {
  const supabase = createClientApiClient()
  
  // List buckets to check if our bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('Error listing buckets:', listError)
    throw new Error('Unable to access storage. Please contact support.')
  }
  
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  
  if (!bucketExists) {
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })
    
    if (createError) {
      console.error('Error creating bucket:', createError)
      throw new Error('Unable to create storage bucket. Please contact support.')
    }
  }
}

// Campaign CRUD operations - Updated functions
export async function getCampaigns(): Promise<MarketingCampaign[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns:', error)
    throw error
  }

  return data || []
}

export async function getCampaignById(id: string): Promise<MarketingCampaign | null> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching campaign:', error)
    throw error
  }

  return data
}

export async function createCampaign(campaignData: CreateCampaignData): Promise<MarketingCampaign> {
  try {
    const { role, userId } = await checkUserAuth()
    assertMarketingWriteAccess(role)

    const supabase = createClientApiClient()

    // Transform the data to match the database schema
    const campaignInsertData = {
      name: campaignData.name,
      description: campaignData.description,
      campaign_type: campaignData.campaign_type,
      status: campaignData.status || 'draft',
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      budget: campaignData.budget,
      created_by: userId,
    }

    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .insert([campaignInsertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      throw new Error(`Failed to create campaign: ${error.message}`)
    }

    return campaign
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw error
  }
}

export async function updateCampaign(id: string, campaignData: Partial<CreateCampaignData>): Promise<MarketingCampaign> {
  try {
    const { role } = await checkUserAuth()
    assertMarketingWriteAccess(role)

    const supabase = createClientApiClient()

    // Transform the data to match the database schema
    const campaignUpdateData = {
      name: campaignData.name,
      description: campaignData.description,
      campaign_type: campaignData.campaign_type,
      status: campaignData.status,
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      budget: campaignData.budget
    }

    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .update(campaignUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      throw new Error(`Failed to update campaign: ${error.message}`)
    }

    return campaign
  } catch (error) {
    console.error('Error updating campaign:', error)
    throw error
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  const { role } = await checkUserAuth()
  assertMarketingWriteAccess(role)
  const supabase = createClientApiClient()
  const { error } = await supabase
    .from('marketing_campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting campaign:', error)
    throw error
  }
}

// Campaign templates
export async function createCampaignTemplate(template: Omit<CampaignTemplate, 'id' | 'created_at'>): Promise<CampaignTemplate> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('campaign_templates')
    .insert([{
      name: template.name,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      category: template.category,
      is_active: template.is_active,
      created_by: template.created_by
    }])
    .select()
    .single()

  if (error) throw error
  return data as CampaignTemplate
}

export async function getCampaignTemplates(): Promise<CampaignTemplate[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('campaign_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CampaignTemplate[]
}

// Customer segments
export async function createCustomerSegment(segment: Omit<CustomerSegment, 'id' | 'created_at'>): Promise<CustomerSegment> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('customer_segments')
    .insert([{
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      customer_count: segment.customer_count,
      is_active: segment.is_active,
      created_by: segment.created_by
    }])
    .select()
    .single()

  if (error) throw error
  return data as CustomerSegment
}

export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('customer_segments')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as CustomerSegment[]
}

// Get customers for a segment
export async function getSegmentCustomers(segmentId: string): Promise<Array<{ id: string; name: string; email: string }>> {
  const supabase = createClientApiClient()
  const { data: segment, error: segmentError } = await supabase
    .from('customer_segments')
    .select('criteria')
    .eq('id', segmentId)
    .single()

  if (segmentError) throw segmentError

  let query = supabase
    .from('customers')
    .select('id, name, email')

  // Apply segment criteria
  if (segment.criteria) {
    const criteria = segment.criteria as any
    
    if (criteria.min_visits) {
      query = query.gte('total_visits', criteria.min_visits)
    }
    
    if (criteria.max_visits) {
      query = query.lte('total_visits', criteria.max_visits)
    }
    
    if (criteria.loyalty_tier) {
      query = query.eq('loyalty_tier', criteria.loyalty_tier)
    }
    
    if (criteria.last_visit_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - criteria.last_visit_days)
      query = query.gte('last_visit', cutoffDate.toISOString())
    }
    
    if (criteria.has_email) {
      query = query.not('email', 'is', null)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Campaign execution
export async function executeCampaign(campaignId: string): Promise<{ success: number; failed: number }> {
  const supabase = createClientApiClient()
  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError) throw campaignError

  // Get segment customers
  const customers = await getSegmentCustomers(campaign.segment_id)
  
  if (customers.length === 0) {
    return { success: 0, failed: 0 }
  }

  // Send bulk email
  const result = await sendBulkMarketingCampaign(
    customers,
    campaign.subject,
    campaign.content,
    'Your Bar'
  )

  // Update campaign with results
  await supabase
    .from('marketing_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: result.success,
      opened_count: 0, // Will be updated by email tracking
      clicked_count: 0 // Will be updated by email tracking
    })
    .eq('id', campaignId)

  return result
}

// Scheduled campaign execution
export async function executeScheduledCampaigns(): Promise<void> {
  const supabase = createClientApiClient()
  const now = new Date()
  
  // Get all scheduled campaigns that are due
  const { data: campaigns, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString())

  if (error) throw error

  // Execute each campaign
  for (const campaign of campaigns || []) {
    try {
      await executeCampaign(campaign.id)
    } catch (e) {
      console.error(`Failed to execute campaign ${campaign.id}:`, e)
    }
  }
}

// Campaign analytics
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) throw error

  return {
    campaign_id: campaignId,
    opens: data.opened_count || 0,
    clicks: data.clicked_count || 0,
    bounces: 0, // Not tracked in old schema
    unsubscribes: data.unsubscribed_count || 0,
    total_sent: data.sent_count || 0,
    open_rate: data.sent_count > 0 ? (data.opened_count / data.sent_count) * 100 : 0,
    click_rate: data.sent_count > 0 ? (data.clicked_count / data.sent_count) * 100 : 0,
    created_at: data.created_at
  }
}

// Automation workflows
export async function createAutomationWorkflow(workflow: Omit<AutomationWorkflow, 'id' | 'created_at'>): Promise<AutomationWorkflow> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('automation_workflows')
    .insert([{
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      trigger_conditions: workflow.trigger_conditions,
      actions: workflow.actions,
      is_active: workflow.is_active,
      created_by: workflow.created_by
    }])
    .select()
    .single()

  if (error) throw error
  return data as AutomationWorkflow
}

export async function getAutomationWorkflows(): Promise<AutomationWorkflow[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AutomationWorkflow[]
}

// Process automation triggers
export async function processAutomationTriggers(triggerType: string, triggerData: any): Promise<void> {
  const supabase = createClientApiClient()
  
  // Get all active workflows for this trigger type
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)

  if (error) throw error

  // Process each workflow
  for (const workflow of workflows || []) {
    try {
      await executeWorkflowActions(workflow, triggerData)
    } catch (e) {
      console.error(`Failed to execute workflow ${workflow.id}:`, e)
    }
  }
}

async function executeWorkflowActions(workflow: AutomationWorkflow, triggerData: any): Promise<void> {
  const supabase = createClientApiClient()
  
  for (const action of workflow.actions || []) {
    switch (action.type) {
      case 'send_email':
        // Send email to customer
        if (triggerData.customer_email) {
          await sendBulkMarketingCampaign(
            [{ name: triggerData.customer_name || 'Customer', email: triggerData.customer_email }],
            action.subject || 'Automated Message',
            action.content || '',
            'Your Bar'
          )
        }
        break
        
      case 'update_loyalty':
        // Update customer loyalty points
        if (triggerData.customer_id) {
          await supabase
            .from('customers')
            .update({ 
              loyalty_points: (triggerData.loyalty_points || 0) + (action.points || 0)
            })
            .eq('id', triggerData.customer_id)
        }
        break
        
      case 'create_booking_reminder':
        // Create booking reminder
        if (triggerData.booking) {
          // This would integrate with your booking reminder system
      
        }
        break
        
      default:
        console.warn(`Unknown action type: ${action.type}`)
    }
  }
}

// Campaign scheduling
export async function scheduleCampaign(schedule: CampaignSchedule): Promise<void> {
  const supabase = createClientApiClient()
  
  // Update campaign with scheduled time
  await supabase
    .from('marketing_campaigns')
    .update({
      scheduled_at: schedule.scheduled_time ? new Date(schedule.scheduled_time).toISOString() : new Date().toISOString(),
      status: 'scheduled'
    })
    .eq('id', schedule.campaign_id)
}

// Marketing analytics
export async function getMarketingAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
  const supabase = createClientApiClient()
  
  let query = supabase
    .from('marketing_campaigns')
    .select('*')

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }

  const { data: campaigns, error } = await query

  if (error) throw error

  const total_campaigns = campaigns?.length || 0
  const total_sent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
  const total_opened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0
  const total_clicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0

  return {
    total_campaigns,
    total_sent,
    total_opened,
    total_clicked,
    average_open_rate: total_sent > 0 ? (total_opened / total_sent) * 100 : 0,
    average_click_rate: total_sent > 0 ? (total_clicked / total_sent) * 100 : 0
  }
}

// Newsletter Functions
export async function getNewsletters(): Promise<Newsletter[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createNewsletter(newsletterData: CreateNewsletterData): Promise<Newsletter> {
  const supabase = createClientApiClient()
  const { role, userId } = await checkUserAuth()
  assertMarketingWriteAccess(role)

  const { data, error } = await supabase
    .from('newsletters')
    .insert([{ 
      name: newsletterData.name,
      subject: newsletterData.subject,
      content: newsletterData.content,
      status: newsletterData.status || 'draft',
      created_by: userId,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating newsletter:', error)
    throw new Error(`Failed to create newsletter: ${error.message}`)
  }

  return data as Newsletter
}

export async function updateNewsletter(id: string, newsletterData: Partial<CreateNewsletterData>): Promise<Newsletter> {
  const supabase = createClientApiClient()
  const { role } = await checkUserAuth()
  assertMarketingWriteAccess(role)

  const { data, error } = await supabase
    .from('newsletters')
    .update({
      name: newsletterData.name,
      subject: newsletterData.subject,
      content: newsletterData.content,
      status: newsletterData.status
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating newsletter:', error)
    throw new Error(`Failed to update newsletter: ${error.message}`)
  }

  return data as Newsletter
}

export async function sendNewsletter(id: string): Promise<Newsletter> {
  const supabase = createClientApiClient()
  
  // First check if newsletter exists
  const { data: existingNewsletter, error: fetchError } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching newsletter:', fetchError)
    throw new Error(`Newsletter not found: ${fetchError.message}`)
  }

  if (!existingNewsletter) {
    throw new Error('Newsletter not found')
  }

  const { data, error } = await supabase
    .from('newsletters')
    .update({ 
      status: 'sent', 
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error sending newsletter:', error)
    throw new Error(`Failed to send newsletter: ${error.message}`)
  }

  return data as Newsletter
}

export async function deleteNewsletter(id: string): Promise<void> {
  const supabase = createClientApiClient()
  const { role } = await checkUserAuth()
  assertMarketingWriteAccess(role)

  const { error } = await supabase
    .from('newsletters')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting newsletter:', error)
    throw new Error(`Failed to delete newsletter: ${error.message}`)
  }
}

// Promotional Materials Functions
export async function getPromotionalMaterials(): Promise<PromotionalMaterial[]> {
  const supabase = createClientApiClient()
  const { data, error } = await supabase
    .from('promotional_materials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function uploadPromotionalMaterial(
  file: File, 
  materialData: Omit<CreatePromoMaterialData, 'file_url' | 'file_type' | 'file_size'>
): Promise<PromotionalMaterial> {
  const supabase = createClientApiClient()
  const { role } = await checkUserAuth()
  assertMarketingWriteAccess(role)

  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported. Please upload images (JPEG, PNG, WebP), PDFs, or Word documents.')
  }

  try {
    // Ensure storage bucket exists
    await ensureStorageBucket('promotional-materials')

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = fileName // Store directly in bucket root

    const { error: uploadError } = await supabase.storage
      .from('promotional-materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw new Error(`Failed to upload promotional material: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('promotional-materials')
      .getPublicUrl(filePath)

    // Create database record
    const { data, error } = await supabase
      .from('promotional_materials')
      .insert([{
        ...materialData,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating promotional material record:', error)
      throw new Error(`Failed to create promotional material record: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in uploadPromotionalMaterial:', error)
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('An unexpected error occurred while uploading the file.')
    }
  }
}

export async function deletePromotionalMaterial(id: string): Promise<void> {
  const supabase = createClientApiClient()
  const { role } = await checkUserAuth()
  assertMarketingWriteAccess(role)
  
  // Get the file URL first
  const { data: material } = await supabase
    .from('promotional_materials')
    .select('file_url')
    .eq('id', id)
    .single()

  if (material?.file_url) {
    // Extract file path from URL
    const urlParts = material.file_url.split('/')
    const fileName = urlParts[urlParts.length - 1] // Get the filename from the URL
    
    // Try to delete from storage (ignore errors for now)
    try {
      await supabase.storage
        .from('promotional-materials')
        .remove([fileName])
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('promotional_materials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting promotional material:', error)
    throw new Error(`Failed to delete promotional material: ${error.message}`)
  }
}

// Analytics Functions
export async function getMarketingOverview(): Promise<{
  totalCampaigns: number;
  totalNewsletters: number;
  totalMaterials: number;
  averageOpenRate: number;
  averageClickRate: number;
}> {
  const supabase = createClientApiClient()
  
  // Get counts
  const { count: campaignsCount } = await supabase
    .from('marketing_campaigns')
    .select('*', { count: 'exact', head: true })

  const { count: newslettersCount } = await supabase
    .from('newsletters')
    .select('*', { count: 'exact', head: true })

  const { count: materialsCount } = await supabase
    .from('promotional_materials')
    .select('*', { count: 'exact', head: true })

  // Get average rates from analytics
  const { data: analytics } = await supabase
    .from('campaign_analytics')
    .select('open_rate, click_rate')

  const averageOpenRate = analytics && analytics.length > 0 
    ? analytics.reduce((sum, a) => sum + (a.open_rate || 0), 0) / analytics.length 
    : 0

  const averageClickRate = analytics && analytics.length > 0 
    ? analytics.reduce((sum, a) => sum + (a.click_rate || 0), 0) / analytics.length 
    : 0

  return {
    totalCampaigns: campaignsCount || 0,
    totalNewsletters: newslettersCount || 0,
    totalMaterials: materialsCount || 0,
    averageOpenRate: Math.round(averageOpenRate * 100) / 100,
    averageClickRate: Math.round(averageClickRate * 100) / 100
  }
} 