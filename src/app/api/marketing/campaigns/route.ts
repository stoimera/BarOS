import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerApiClient } from '@/utils/supabase/api'
import { CreateCampaignData } from '@/types/marketing'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.marketing.campaigns')

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  campaign_type: z.enum(['email', 'social', 'sms', 'promotion']),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().nullable().optional(),
})

export const GET = withSecurity(
  async () => {
    try {
      const supabase = await createServerApiClient()
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        log.error('Error fetching campaigns:', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
      }

      return NextResponse.json(data || [])
    } catch (error) {
      let message = 'Failed to fetch campaigns'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'campaign',
  }
)

export const POST = withSecurity<CreateCampaignData>(
  async (req, { validatedBody }) => {
    try {
      const supabase = await createServerApiClient()
      const campaignData = validatedBody as CreateCampaignData

      // Transform the data to match the database schema
      const campaignInsertData = {
        name: campaignData.name,
        description: campaignData.description,
        campaign_type: campaignData.campaign_type,
        status: campaignData.status || 'draft',
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        budget: campaignData.budget,
        // Omit created_by for now to avoid UUID issues
      }

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([campaignInsertData])
        .select()
        .single()

      if (error) {
        log.error('Error creating campaign:', error)
        return NextResponse.json(
          { error: `Failed to create campaign: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ campaign: data })
    } catch (error) {
      let message = 'Failed to create campaign'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: createCampaignSchema,
    auditAction: 'create',
    auditResourceType: 'campaign',
  }
)

export const DELETE = withSecurity(
  async (req) => {
    try {
      const supabase = await createServerApiClient()
      const { campaignId } = await req.json()

      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', campaignId)

      if (error) {
        log.error('Error deleting campaign:', error)
        return NextResponse.json(
          { error: `Failed to delete campaign: ${error.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      let message = 'Failed to delete campaign'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'campaign',
  }
)
