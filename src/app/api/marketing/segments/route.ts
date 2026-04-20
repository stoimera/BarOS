import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createServerApiClient } from '@/utils/supabase/api'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.marketing.segments')

export const GET = withSecurity(
  async () => {
    try {
      const supabase = await createServerApiClient()
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        log.error('Error fetching segments:', error)
        return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 })
      }

      return NextResponse.json(data || [])
    } catch (error) {
      let message = 'Failed to fetch segments'
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
