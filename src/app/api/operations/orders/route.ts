import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const createOrderSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  table_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
})

export const POST = withSecurity(
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createOrderSchema>
    const supabase = await createClient()
    const locationId = body.location_id ?? scopedLocationId ?? null
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: body.customer_id ?? null,
          table_id: body.table_id ?? null,
          location_id: locationId,
          status: 'open',
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createOrderSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
