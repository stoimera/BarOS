import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { applyPurchaseOrderReceive } from '@/lib/operations/procurement'

const receivePurchaseOrderSchema = z.object({
  received_at: z.string().optional(),
  allow_overfill: z.boolean().optional(),
  lines: z
    .array(
      z.object({
        purchase_order_item_id: z.string().uuid(),
        quantity_received: z.number().int().nonnegative(),
      })
    )
    .optional(),
})

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody, user }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof receivePurchaseOrderSchema>
    const supabase = await createClient()

    try {
      if (body.lines?.length) {
        await applyPurchaseOrderReceive({
          supabase,
          purchaseOrderId: params.id,
          lines: body.lines,
          allowOverfill: body.allow_overfill ?? false,
          actorProfileId: user.profileId,
        })
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'received',
          received_at: body.received_at ?? new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Receive failed' },
        { status: 400 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    rateLimitType: 'strict',
    validateBody: receivePurchaseOrderSchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)
