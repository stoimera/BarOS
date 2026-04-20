import { createLogger } from '@/lib/logger'

const log = createLogger('api.gdpr.export.me')

import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { exportCustomerData } from '@/lib/gdpr/data-export'
import { getCustomerIdForProfile } from '@/lib/gdpr/dsar-authorization'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async (req, { user }) => {
    const supabase = await createClient()
    const customerId = await getCustomerIdForProfile(supabase, user.profileId)
    if (!customerId) {
      return NextResponse.json({ error: 'No customer profile linked to this account' }, { status: 404 })
    }

    try {
      const exportedData = await exportCustomerData(customerId, user.profileId, undefined, req)

      return NextResponse.json(exportedData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="my-customer-data.json"`,
        },
      })
    } catch (error) {
      log.error('Data export error:', error)
      return NextResponse.json(
        {
          error: 'Failed to export data',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'strict',
    auditAction: 'export',
    auditResourceType: 'customer',
  }
)
