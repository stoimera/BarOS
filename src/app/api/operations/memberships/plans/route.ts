import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const createPlanSchema = z.object({
  name: z.string().min(1).max(200),
  billing_interval: z.enum(['monthly', 'annual']).optional(),
})

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('membership_plans')
      .select('id, name, billing_interval, is_active, created_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'customer',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = validatedBody as z.infer<typeof createPlanSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('membership_plans')
      .insert({
        name: body.name,
        billing_interval: body.billing_interval ?? 'monthly',
        is_active: true,
      })
      .select('id, name, billing_interval, is_active')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    rateLimitType: 'strict',
    validateBody: createPlanSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
