import { supabase } from './supabase'

export interface Integration {
  id: string
  name: string
  type: IntegrationType
  status: 'active' | 'inactive' | 'error'
  config: Record<string, any>
  last_sync?: Date
  created_at: Date
  updated_at: Date
}

export enum IntegrationType {
  PAYMENT_PROCESSOR = 'payment_processor',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_MARKETING = 'email_marketing',
  ANALYTICS = 'analytics',
  BOOKING_SYSTEM = 'booking_system',
  INVENTORY_SYSTEM = 'inventory_system'
}

export interface PaymentProcessorConfig {
  provider: 'stripe' | 'square' | 'paypal'
  apiKey: string
  webhookSecret?: string
  currency: string
  testMode: boolean
}

export interface SocialMediaConfig {
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok'
  accessToken: string
  pageId?: string
  autoPost: boolean
}

export interface EmailMarketingConfig {
  provider: 'mailchimp' | 'sendgrid' | 'resend'
  apiKey: string
  listId?: string
  autoSync: boolean
}

type IntegrationRow = {
  id: string
  name: string
  integration_type: string
  config: Record<string, unknown>
  is_active: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

function dbIntegrationTypeToEnum(t: string): IntegrationType {
  switch (t) {
    case 'payment':
      return IntegrationType.PAYMENT_PROCESSOR
    case 'social':
      return IntegrationType.SOCIAL_MEDIA
    case 'email':
      return IntegrationType.EMAIL_MARKETING
    case 'analytics':
      return IntegrationType.ANALYTICS
    case 'other':
    default:
      return IntegrationType.PAYMENT_PROCESSOR
  }
}

function integrationEnumToDbType(t: IntegrationType): string {
  switch (t) {
    case IntegrationType.PAYMENT_PROCESSOR:
      return 'payment'
    case IntegrationType.SOCIAL_MEDIA:
      return 'social'
    case IntegrationType.EMAIL_MARKETING:
      return 'email'
    case IntegrationType.ANALYTICS:
      return 'analytics'
    case IntegrationType.BOOKING_SYSTEM:
    case IntegrationType.INVENTORY_SYSTEM:
      return 'other'
    default:
      return 'other'
  }
}

function mapRowToIntegration(row: IntegrationRow): Integration {
  return {
    id: row.id,
    name: row.name,
    type: dbIntegrationTypeToEnum(row.integration_type),
    status: row.is_active ? 'active' : 'inactive',
    config: row.config ?? {},
    last_sync: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }
}

function normalizeSocialPlatform(
  platform: string
): 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' {
  const p = platform.toLowerCase()
  const allowed = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'] as const
  if ((allowed as readonly string[]).includes(p)) {
    return p as (typeof allowed)[number]
  }
  return 'twitter'
}

// Integration CRUD operations
export async function fetchIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return (data as IntegrationRow[] | null)?.map(mapRowToIntegration) ?? []
}

export async function createIntegration(integration: Omit<Integration, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('integrations')
    .insert([
      {
        name: integration.name,
        integration_type: integrationEnumToDbType(integration.type),
        config: integration.config,
        is_active: integration.status === 'active',
        last_sync_at: integration.last_sync?.toISOString() ?? null,
      },
    ])
    .select()
    .single()
  
  if (error) throw error
  return mapRowToIntegration(data as IntegrationRow)
}

export async function updateIntegration(id: string, updates: Partial<Integration>) {
  const payload: Record<string, unknown> = {}

  if (updates.name !== undefined) payload.name = updates.name
  if (updates.config !== undefined) payload.config = updates.config
  if (updates.type !== undefined) {
    payload.integration_type = integrationEnumToDbType(updates.type)
  }
  if (updates.status !== undefined) {
    payload.is_active = updates.status === 'active'
  }
  if (updates.last_sync !== undefined) {
    payload.last_sync_at = updates.last_sync?.toISOString() ?? null
  }

  const { data, error } = await supabase
    .from('integrations')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return mapRowToIntegration(data as IntegrationRow)
}

export async function deleteIntegration(id: string) {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Payment processor integrations
export async function processPayment(amount: number, currency: string, customerId: string, description: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert([
      {
        customer_id: customerId,
        amount,
        payment_method: 'card',
        status: 'completed',
        transaction_id: `pay_${Date.now()}`,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id as string,
    amount,
    currency,
    customerId,
    description,
    status: 'completed' as const,
    created_at: new Date(),
  }
}

export async function createPaymentIntent(amount: number, currency: string, customerId: string) {
  // Simulate creating a payment intent
  return {
    id: `pi_${Date.now()}`,
    amount,
    currency,
    customerId,
    status: 'requires_payment_method',
    client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Social media integrations
export async function postToSocialMedia(platform: string, content: string, imageUrl?: string) {
  const normalizedPlatform = normalizeSocialPlatform(platform)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('social_posts')
    .insert([
      {
        platform: normalizedPlatform,
        content,
        media_urls: imageUrl ? [imageUrl] : [],
        status: 'posted',
        posted_at: now,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id as string,
    platform: normalizedPlatform,
    content,
    imageUrl,
    status: 'posted' as const,
    created_at: new Date((data as { created_at: string }).created_at),
  }
}

export async function scheduleSocialPost(platform: string, content: string, scheduledTime: Date, imageUrl?: string) {
  const normalizedPlatform = normalizeSocialPlatform(platform)

  const { data, error } = await supabase
    .from('social_posts')
    .insert([
      {
        platform: normalizedPlatform,
        content,
        media_urls: imageUrl ? [imageUrl] : [],
        scheduled_at: scheduledTime.toISOString(),
        status: 'scheduled',
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id as string,
    platform: normalizedPlatform,
    content,
    imageUrl,
    scheduledTime,
    status: 'scheduled' as const,
    created_at: new Date((data as { created_at: string }).created_at),
  }
}

// Email marketing integrations
export async function syncCustomersToEmailList(listId: string) {
  void listId
  // This would sync customers with email marketing platforms
  const { data: customers } = await supabase
    .from('customers')
    .select('name, email')
  
  if (!customers) return { synced: 0 }
  
  // Simulate syncing to email list
  const synced = customers.length
  
  return { synced }
}

export async function sendMarketingEmail(subject: string, content: string, recipientList: string[]) {
  const sentAt = new Date().toISOString()
  const rows = recipientList.map((email_address) => ({
    email_address,
    status: 'sent' as const,
    sent_at: sentAt,
  }))

  const { data, error } = await supabase.from('marketing_emails').insert(rows).select()

  if (error) throw error

  return {
    subject,
    content,
    recipientCount: recipientList.length,
    rows: data ?? [],
    sent_at: sentAt,
  }
}

// Analytics integrations
export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown>,
  options?: { sessionId?: string | null; userId?: string | null }
) {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert([
      {
        event_name: eventName,
        event_data: properties,
        session_id: options?.sessionId ?? null,
        user_id: options?.userId ?? null,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id as string,
    event_name: eventName,
    event_data: properties,
    created_at: new Date((data as { created_at: string }).created_at),
  }
}

export async function getAnalyticsData(startDate: Date, endDate: Date) {
  // This would fetch data from analytics platforms
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  return {
    totalEvents: events?.length || 0,
    events: events || []
  }
}

// Booking system integrations
export async function syncBookingsWithExternalSystem() {
  // Schema has no `synced` flag; external booking sync is a placeholder until modeled in DB.
  return { synced: 0 }
}

// Inventory system integrations
export async function syncInventoryWithExternalSystem() {
  // Schema has no `synced` flag; external inventory sync is a placeholder until modeled in DB.
  return { synced: 0 }
}

// Webhook handlers
export async function handlePaymentWebhook(payload: unknown, signature: string) {
  const { data, error } = await supabase
    .from('webhooks')
    .insert([
      {
        name: 'payment-webhook-ingest',
        url: 'https://webhooks.internal/payment',
        events: ['payment'],
        secret_key: signature.slice(0, 512),
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id as string,
    payload,
    signature,
    created_at: new Date((data as { created_at: string }).created_at),
  }
}

// Integration health checks
export async function checkIntegrationHealth(integrationId: string): Promise<{ status: string; message: string }> {
  // This would check the health of integrations
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .single()
  
  if (!integration) {
    return { status: 'error', message: 'Integration not found' }
  }
  
  // Simulate health check
  const isHealthy = Math.random() > 0.1 // 90% success rate
  
  if (isHealthy) {
    return { status: 'healthy', message: 'Integration is working properly' }
  } else {
    return { status: 'error', message: 'Integration is experiencing issues' }
  }
}

// Sync all integrations
export async function syncAllIntegrations() {
  const integrations = await fetchIntegrations()
  const activeIntegrations = integrations.filter(i => i.status === 'active')
  
  const results = await Promise.allSettled(
    activeIntegrations.map(async (integration) => {
      switch (integration.type) {
        case IntegrationType.BOOKING_SYSTEM:
          return await syncBookingsWithExternalSystem()
        case IntegrationType.INVENTORY_SYSTEM:
          return await syncInventoryWithExternalSystem()
        case IntegrationType.EMAIL_MARKETING:
          return await syncCustomersToEmailList(integration.config.listId)
        default:
          return { synced: 0 }
      }
    })
  )
  
  return results.map((result, index) => ({
    integration: activeIntegrations[index],
    result: result.status === 'fulfilled' ? result.value : { error: result.reason }
  }))
} 