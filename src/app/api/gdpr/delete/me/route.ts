import { createLogger } from '@/lib/logger'

const log = createLogger('api.gdpr.delete.me')

import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { deleteCustomerData, anonymizeCustomerData } from '@/lib/gdpr/data-export'
import { getCustomerIdForProfile } from '@/lib/gdpr/dsar-authorization'
import { createClient } from '@/utils/supabase/server'
import { gdprDeleteMeRequestSchema } from '@/lib/gdpr/delete-request'
import type { z } from 'zod'

export const POST = withSecurity(
  async (req, { user, validatedBody }) => {
    const body = validatedBody as z.infer<typeof gdprDeleteMeRequestSchema>
    const supabase = await createClient()
    const customerId = await getCustomerIdForProfile(supabase, user.profileId)
    if (!customerId) {
      return NextResponse.json({ error: 'No customer profile linked to this account' }, { status: 404 })
    }

    if (user.role !== 'customer') {
      return NextResponse.json({ error: 'This endpoint is for consumer accounts only' }, { status: 403 })
    }

    try {
      if (body.anonymize) {
        await anonymizeCustomerData(customerId, user.profileId, undefined, req)
        return NextResponse.json({ success: true, message: 'Your data has been anonymized' })
      }
      await deleteCustomerData(customerId, user.profileId, undefined, req)
      return NextResponse.json({ success: true, message: 'Your data has been deleted' })
    } catch (error) {
      log.error('Data deletion error:', error)
      return NextResponse.json(
        {
          error: 'Failed to process request',
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
    validateBody: gdprDeleteMeRequestSchema,
    auditAction: 'delete',
    auditResourceType: 'customer',
  }
)
