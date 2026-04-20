import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerApiClient } from '@/utils/supabase/api'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.marketing.analytics')

export const GET = withSecurity(
  async (req) => {
    try {
      const supabase = await createServerApiClient()
      const { searchParams } = new URL(req.url)
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      let query = supabase
        .from('marketing_campaigns')
        .select(
          'id, name, campaign_type, status, start_date, end_date, budget, created_at, updated_at, sent_count, opened_count, clicked_count'
        )

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data: campaigns, error } = await query

      if (error) {
        log.error('Error fetching analytics:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
      }

      const total_campaigns = campaigns?.length || 0
      const total_sent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
      const total_opened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0
      const total_clicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0

      const analytics = {
        total_campaigns,
        total_sent,
        total_opened,
        total_clicked,
        average_open_rate: total_sent > 0 ? (total_opened / total_sent) * 100 : 0,
        average_click_rate: total_sent > 0 ? (total_clicked / total_sent) * 100 : 0,
      }

      return NextResponse.json(analytics)
    } catch (error) {
      let message = 'Failed to fetch analytics'
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
