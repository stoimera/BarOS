import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerApiClient } from '@/utils/supabase/api'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.marketing.execute')

const executeCampaignSchema = z.object({
  campaignId: z.string().uuid(),
})

export const POST = withSecurity(
  async (req, { validatedBody }) => {
    try {
      const supabase = await createServerApiClient()
      const { campaignId } = validatedBody as z.infer<typeof executeCampaignSchema>

      // Get campaign details
      const { error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) {
        log.error('Error fetching campaign:', campaignError)
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      // Update campaign status to completed
      const { error: updateError } = await supabase
        .from('marketing_campaigns')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)

      if (updateError) {
        log.error('Error updating campaign:', updateError)
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
      }

      // For now, return a mock result since we don't have email sending implemented
      const result = {
        success: 0,
        failed: 0,
      }

      return NextResponse.json(result)
    } catch (error) {
      let message = 'Failed to execute campaign'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: executeCampaignSchema,
    auditAction: 'update',
    auditResourceType: 'campaign',
  }
)
