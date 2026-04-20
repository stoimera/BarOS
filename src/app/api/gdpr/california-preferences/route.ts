import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { applyCaliforniaPreferencesForCustomer } from '@/lib/gdpr/ccpa-preferences'
import { getCustomerIdForProfile } from '@/lib/gdpr/dsar-authorization'
import { createClient } from '@/utils/supabase/server'

const prefsSchema = z.object({
  do_not_sell_or_share: z.boolean(),
  limit_sensitive_use: z.boolean().optional().default(false),
})

export const POST = withSecurity(
  async (_req, { user, validatedBody }) => {
    const body = validatedBody as z.infer<typeof prefsSchema>
    const supabase = await createClient()
    const customerId = await getCustomerIdForProfile(supabase, user.profileId)
    if (!customerId) {
      return NextResponse.json({ error: 'No customer profile linked to this account' }, { status: 404 })
    }

    const { data, error } = await applyCaliforniaPreferencesForCustomer(customerId, {
      do_not_sell_or_share: body.do_not_sell_or_share,
      limit_sensitive_use: body.limit_sensitive_use,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'strict',
    validateBody: prefsSchema,
    auditAction: 'update',
    auditResourceType: 'customer',
  }
)
