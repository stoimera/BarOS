import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const assignSchema = z.object({
  customer_id: z.string().uuid(),
  plan_id: z.string().uuid(),
})

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = validatedBody as z.infer<typeof assignSchema>
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('customer_memberships')
      .select('id')
      .eq('customer_id', body.customer_id)
      .eq('plan_id', body.plan_id)
      .maybeSingle()

    const started = new Date().toISOString()
    if (existing?.id) {
      const { data, error } = await supabase
        .from('customer_memberships')
        .update({ status: 'active', started_at: started })
        .eq('id', (existing as { id: string }).id)
        .select('id, customer_id, plan_id, status, started_at')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    const { data, error } = await supabase
      .from('customer_memberships')
      .insert({
        customer_id: body.customer_id,
        plan_id: body.plan_id,
        status: 'active',
        started_at: started,
      })
      .select('id, customer_id, plan_id, status, started_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    rateLimitType: 'strict',
    validateBody: assignSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
