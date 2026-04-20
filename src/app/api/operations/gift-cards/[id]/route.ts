import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const voidSchema = z.object({
  action: z.literal('void'),
})

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody, user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof voidSchema>
    if (body.action !== 'void') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gift_cards')
      .update({ status: 'void', balance_cents: 0 })
      .eq('id', params.id)
      .select('id, balance_cents, status')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    rateLimitType: 'strict',
    validateBody: voidSchema,
    auditAction: 'update',
    auditResourceType: 'customer',
  }
)
