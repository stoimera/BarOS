import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const consentSchema = z.object({
  customer_id: z.string().uuid(),
  channel: z.enum(['email', 'sms', 'push']),
  consent_state: z.boolean(),
  source: z.string().min(1),
})

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof consentSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marketing_consent_events')
      .insert([body])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'compliance.write',
    rateLimitType: 'strict',
    validateBody: consentSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
