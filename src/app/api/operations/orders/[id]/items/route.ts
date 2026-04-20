import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import { appendOrderEvent } from '@/lib/operations/order-events'
import { assertOrderCustomerMeetsAgeForMenuItem } from '@/lib/operations/order-age-sale'

const createOrderItemSchema = z.object({
  item_name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  menu_item_id: z.string().uuid().optional(),
})

export const POST = withSecurity(
  async (_req, { routeContext, validatedBody, user, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof createOrderItemSchema>
    const lineTotal = Number((body.quantity * body.unit_price).toFixed(2))

    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard

    if (body.menu_item_id) {
      const age = await assertOrderCustomerMeetsAgeForMenuItem({
        supabase,
        orderId: params.id,
        menuItemId: body.menu_item_id,
      })
      if (!age.ok) return NextResponse.json({ error: age.message }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from('order_items')
      .insert([{ ...body, order_id: params.id, line_total: lineTotal }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('line_total')
      .eq('order_id', params.id)
    const subtotal = (orderItems || []).reduce((sum, row) => sum + Number(row.line_total || 0), 0)
    await supabase.from('orders').update({ subtotal, total: subtotal }).eq('id', params.id)

    try {
      await appendOrderEvent(supabase, {
        orderId: params.id,
        eventType: 'order_item_added',
        payload: {
          order_item_id: (item as { id: string }).id,
          item_name: body.item_name,
          quantity: body.quantity,
          unit_price: body.unit_price,
          line_total: lineTotal,
        },
        actorProfileId: user.profileId,
      })
    } catch {
      // Event append must not undo item creation; surface only in logs if needed.
    }

    return NextResponse.json({ data: item, subtotal })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createOrderItemSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)
