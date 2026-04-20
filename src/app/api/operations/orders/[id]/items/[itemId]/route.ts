import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import { adjustOrderItemQuantity } from '@/lib/operations/order-items'
import { appendOrderEvent } from '@/lib/operations/order-events'

const adjustSchema = z.object({
  quantity: z.number().int().positive(),
  reason: z.string().min(3),
})

const stationSchema = z.object({
  station: z.enum(['kitchen', 'bar', 'service']).nullable(),
})

const patchBodySchema = z.union([adjustSchema, stationSchema])

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody, user, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string; itemId: string } }
    const body = validatedBody as z.infer<typeof patchBodySchema>
    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard

    if ('station' in body && !('quantity' in body)) {
      const { data, error } = await supabase
        .from('order_items')
        .update({ station: body.station })
        .eq('id', params.itemId)
        .eq('order_id', params.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await appendOrderEvent(supabase, {
        orderId: params.id,
        eventType: 'order_item_station',
        payload: { order_item_id: params.itemId, station: body.station },
        actorProfileId: user.profileId,
      })
      return NextResponse.json({ data })
    }

    const adj = body as z.infer<typeof adjustSchema>
    try {
      const { item, subtotal } = await adjustOrderItemQuantity({
        supabase,
        orderId: params.id,
        orderItemId: params.itemId,
        quantity: adj.quantity,
        reason: adj.reason,
        actorProfileId: user.profileId,
      })
      return NextResponse.json({ data: item, subtotal })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Adjustment failed' },
        { status: 400 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: patchBodySchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)
