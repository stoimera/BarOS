import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import { recordTipPoolEntry } from '@/lib/operations/tips'

const tipSchema = z.object({
  amount: z.number().nonnegative(),
  pool_type: z.enum(['staff', 'kitchen', 'house']),
})

export const POST = withSecurity(
  async (_req, { routeContext, validatedBody, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof tipSchema>
    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard

    try {
      const data = await recordTipPoolEntry({
        orderId: params.id,
        amount: body.amount,
        poolType: body.pool_type,
      })
      return NextResponse.json({ data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Tip recording failed' },
        { status: 400 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: tipSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
