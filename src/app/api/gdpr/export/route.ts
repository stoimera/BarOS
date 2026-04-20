import { createLogger } from '@/lib/logger'

const log = createLogger('api.gdpr.export')

import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { exportCustomerData } from '@/lib/gdpr/data-export'
import { assertGdprExportAccess } from '@/lib/gdpr/dsar-authorization'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { commonSchemas } from '@/lib/security/validation'

const exportSchema = z.object({
  customerId: commonSchemas.uuid,
})

export const GET = withSecurity(
  async (req, { user }) => {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId parameter' }, { status: 400 })
    }

    const validation = exportSchema.safeParse({ customerId })
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid customerId format' }, { status: 400 })
    }

    const supabase = await createClient()
    const access = await assertGdprExportAccess({
      supabase,
      role: user.role,
      profileId: user.profileId,
      targetCustomerId: customerId,
    })
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status })
    }

    try {
      const exportedData = await exportCustomerData(customerId, user.profileId, undefined, req)

      return NextResponse.json(exportedData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customer-data-${customerId}.json"`,
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
    rateLimitType: 'strict',
    auditAction: 'export',
    auditResourceType: 'customer',
  }
)
