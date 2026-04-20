import { createLogger } from '@/lib/logger'

const log = createLogger('api.gdpr.delete')

import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { deleteCustomerData, anonymizeCustomerData } from '@/lib/gdpr/data-export'
import { assertGdprDeleteAccess } from '@/lib/gdpr/dsar-authorization'
import { createClient } from '@/utils/supabase/server'
import { gdprDeleteRequestSchema } from '@/lib/gdpr/delete-request'
import type { z } from 'zod'

export const POST = withSecurity(
  async (req, { user, validatedBody }) => {
    const body = validatedBody as z.infer<typeof gdprDeleteRequestSchema>

    if (!body) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 })
    }

    const supabase = await createClient()
    const access = await assertGdprDeleteAccess({
      supabase,
      role: user.role,
      profileId: user.profileId,
      targetCustomerId: body.customerId,
    })
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status })
    }

    try {
      if (body.anonymize) {
        await anonymizeCustomerData(body.customerId, user.profileId, undefined, req)

        return NextResponse.json({
          success: true,
          message: 'Customer data has been anonymized',
        })
      }
      await deleteCustomerData(body.customerId, user.profileId, undefined, req)

      return NextResponse.json({
        success: true,
        message: 'Customer data has been deleted',
      })
    } catch (error) {
      log.error('Data deletion error:', error)
      return NextResponse.json(
        {
          error: 'Failed to delete data',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    rateLimitType: 'strict',
    validateBody: gdprDeleteRequestSchema,
    auditAction: 'delete',
    auditResourceType: 'customer',
  }
)
