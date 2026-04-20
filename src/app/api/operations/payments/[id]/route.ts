import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { transitionPaymentStatus } from '@/lib/operations/payments'

const transitionPaymentSchema = z.object({
  from_status: z.enum(['authorized', 'captured', 'refunded', 'chargeback']),
  to_status: z.enum(['authorized', 'captured', 'refunded', 'chargeback']),
  reason: z.string().min(3),
  processor_reference: z.string().optional(),
})

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody, user, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const payload = validatedBody as z.infer<typeof transitionPaymentSchema>

    if (scopedLocationId) {
      const supabase = await createClient()
      const { data: pay, error: pErr } = await supabase
        .from('payment_transactions')
        .select('order_id')
        .eq('id', params.id)
        .single()
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
      const orderId = pay?.order_id as string | null | undefined
      if (orderId) {
        const { data: ord, error: oErr } = await supabase.from('orders').select('location_id').eq('id', orderId).single()
        if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })
        const ol = ord?.location_id as string | null | undefined
        if (ol && ol !== scopedLocationId) {
          return NextResponse.json({ error: 'Payment order is outside your location scope' }, { status: 403 })
        }
      }
    }

    try {
      const data = await transitionPaymentStatus({
        paymentId: params.id,
        from: payload.from_status,
        to: payload.to_status,
        reason: payload.reason,
        actorProfileId: user.profileId,
        processorReference: payload.processor_reference,
      })

      return NextResponse.json({ data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Transition failed' },
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
    validateBody: transitionPaymentSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)
