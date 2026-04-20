import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const createSchema = z.object({
  location_id: z.string().uuid().nullable().optional(),
  label: z.string().min(1).max(200),
  starts_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  ends_at: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  discount_percent: z.number().min(0).max(100),
  applies_to_category: z.string().max(120).nullable().optional(),
})

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    let q = supabase.from('pricing_windows').select('*').eq('is_active', true).order('starts_at')
    if (scopedLocationId) {
      q = q.or(`location_id.eq.${scopedLocationId},location_id.is.null`)
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
    auditResourceType: 'menu_item',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = validatedBody as z.infer<typeof createSchema>
    const supabase = await createClient()
    const row = {
      location_id: body.location_id ?? null,
      label: body.label,
      starts_at: body.starts_at.length === 5 ? `${body.starts_at}:00` : body.starts_at,
      ends_at: body.ends_at.length === 5 ? `${body.ends_at}:00` : body.ends_at,
      discount_percent: body.discount_percent,
      applies_to_category: body.applies_to_category ?? null,
    }
    const { data, error } = await supabase.from('pricing_windows').insert(row).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'locations.write',
    rateLimitType: 'strict',
    validateBody: createSchema,
    auditAction: 'create',
    auditResourceType: 'menu_item',
  }
)
