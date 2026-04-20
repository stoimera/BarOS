import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import { transitionOrderStatus } from '@/lib/operations/orders'
import { getOrExecuteIdempotent } from '@/lib/operations/idempotency'

const updateOrderSchema = z.object({
  from_status: z.enum(['open', 'active', 'closed', 'voided']),
  to_status: z.enum(['open', 'active', 'closed', 'voided']),
  reason: z.string().min(3),
})

export const GET = withSecurity(
  async (_req, { routeContext, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', params.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)

export const PATCH = withSecurity(
  async (req, { routeContext, validatedBody, user, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const payload = validatedBody as z.infer<typeof updateOrderSchema>
    const idem = req.headers.get('idempotency-key') ?? req.headers.get('x-idempotency-key')

    if (scopedLocationId) {
      const supabase = await createClient()
      const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
      if (guard) return guard
    }

    const result = await getOrExecuteIdempotent(`orders:transition:${params.id}`, idem, async () => {
      try {
        const data = await transitionOrderStatus({
          orderId: params.id,
          from: payload.from_status,
          to: payload.to_status,
          reason: payload.reason,
          actorProfileId: user.profileId,
        })
        return { status: 200, body: { data } }
      } catch (error) {
        return {
          status: 400,
          body: { error: error instanceof Error ? error.message : 'Transition failed' },
        }
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: updateOrderSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)
