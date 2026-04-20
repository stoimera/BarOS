import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const createSchema = z.object({
  order_id: z.string().uuid(),
  fiscal_reference: z.string().max(200).nullable().optional(),
  totals: z.record(z.string(), z.any()).optional(),
})

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales_receipts')
      .select('id, order_id, fiscal_reference, totals, issued_at')
      .order('issued_at', { ascending: false })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof createSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales_receipts')
      .insert({
        order_id: body.order_id,
        fiscal_reference: body.fiscal_reference ?? null,
        totals: body.totals ?? {},
      })
      .select('id, order_id, fiscal_reference, totals, issued_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    rateLimitType: 'strict',
    validateBody: createSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
