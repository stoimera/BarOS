import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const batchSchema = z.object({
  device_id: z.string().min(1).max(200),
  payload: z.record(z.string(), z.any()),
})

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof batchSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('offline_sync_batches')
      .insert({
        device_id: body.device_id,
        payload: body.payload,
        status: 'pending',
      })
      .select('id, device_id, received_at, status')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    rateLimitType: 'strict',
    validateBody: batchSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
