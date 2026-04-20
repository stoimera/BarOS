import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'submitted', 'received', 'cancelled']).optional(),
})

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    let q = supabase.from('purchase_orders').select('*, suppliers(id, name)').order('ordered_at', { ascending: false })
    if (scopedLocationId) {
      q = q.eq('location_id', scopedLocationId)
    }
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createPurchaseOrderSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([
        {
          supplier_id: body.supplier_id ?? null,
          status: body.status ?? 'draft',
          location_id: scopedLocationId ?? null,
        },
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createPurchaseOrderSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
