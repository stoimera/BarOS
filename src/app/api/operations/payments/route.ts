import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { getOrExecuteIdempotent } from '@/lib/operations/idempotency'
import { recordSliEvent } from '@/lib/observability/sli'

const createPaymentSchema = z.object({
  order_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  processor_fee: z.number().nonnegative().optional(),
})

export const GET = withSecurity(
  async (req, { scopedLocationId }) => {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')

    const supabase = await createClient()
    const paySelect = scopedLocationId
      ? '*, orders!inner(id, location_id)'
      : '*'
    let query = supabase.from('payment_transactions').select(paySelect).order('created_at', { ascending: false })
    if (scopedLocationId) {
      query = query.eq('orders.location_id', scopedLocationId)
    }
    if (orderId) query = query.eq('order_id', orderId)
    const { data, error } = await query.limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
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

export const POST = withSecurity(
  async (req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createPaymentSchema>
    const idem = req.headers.get('idempotency-key') ?? req.headers.get('x-idempotency-key')

    if (scopedLocationId) {
      const supabase = await createClient()
      const { data: ord, error: ordErr } = await supabase
        .from('orders')
        .select('location_id')
        .eq('id', body.order_id)
        .single()
      if (ordErr) return NextResponse.json({ error: ordErr.message }, { status: 400 })
      const ol = ord?.location_id as string | null | undefined
      if (ol && ol !== scopedLocationId) {
        return NextResponse.json({ error: 'Order belongs to a different location' }, { status: 403 })
      }
    }

    const result = await getOrExecuteIdempotent(`payments:create:${body.order_id}`, idem, async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([
          {
            order_id: body.order_id,
            customer_id: body.customer_id || null,
            amount: body.amount,
            payment_method: body.payment_method,
            status: 'pending',
            lifecycle_status: 'authorized',
            reconciliation_status: 'pending',
            processor_fee: body.processor_fee || 0,
          },
        ])
        .select()
        .single()

      if (error) return { status: 500, body: { error: error.message } }
      return { status: 200, body: { data } }
    })

    if (result.status >= 200 && result.status < 300) {
      recordSliEvent('payment_created', true)
    }
    return NextResponse.json(result.body, { status: result.status })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createPaymentSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
