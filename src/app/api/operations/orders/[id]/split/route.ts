import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

const allocationSchema = z.object({
  payment_id: z.string().uuid(),
  allocations: z
    .array(
      z.object({
        order_item_id: z.string().uuid(),
        allocated_amount: z.number().nonnegative(),
      })
    )
    .min(1),
})

export const POST = withSecurity(
  async (_req, { routeContext, validatedBody, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof allocationSchema>
    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard

    const rows = body.allocations.map((a) => ({
      payment_id: body.payment_id,
      order_item_id: a.order_item_id,
      allocated_amount: a.allocated_amount,
    }))

    const { data, error } = await supabase.from('split_bill_allocations').insert(rows).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, order_id: params.id })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: allocationSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
