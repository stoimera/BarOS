import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

const createTabSchema = z.object({
  order_id: z.string().uuid().nullable().optional(),
})

export const GET = withSecurity(
  async (req, { scopedLocationId }) => {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')
    const supabase = await createClient()
    const select = scopedLocationId
      ? 'id, order_id, status, preauth_hold_cents, preauth_status, opened_at, orders!inner(location_id)'
      : 'id, order_id, status, preauth_hold_cents, preauth_status, opened_at, orders(location_id)'
    let q = supabase.from('tabs').select(select).order('opened_at', { ascending: false }).limit(100)
    if (scopedLocationId) {
      q = q.eq('orders.location_id', scopedLocationId)
    }
    if (orderId) {
      q = q.eq('order_id', orderId)
    }
    const { data, error } = await q
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
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createTabSchema>
    const supabase = await createClient()
    if (body.order_id) {
      const guard = await orderLocationGuardResponse(supabase, body.order_id, scopedLocationId)
      if (guard) return guard
    }
    const { data, error } = await supabase
      .from('tabs')
      .insert([{ order_id: body.order_id ?? null, status: 'open' }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createTabSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
