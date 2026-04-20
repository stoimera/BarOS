import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const updatePurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'submitted', 'received', 'cancelled']).optional(),
})

export const GET = withSecurity(
  async (_req, { routeContext }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(id, name), purchase_order_items(*)')
      .eq('id', params.id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof updatePurchaseOrderSchema>
    const supabase = await createClient()
    const { data, error } = await supabase.from('purchase_orders').update(body).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    rateLimitType: 'strict',
    validateBody: updatePurchaseOrderSchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)
