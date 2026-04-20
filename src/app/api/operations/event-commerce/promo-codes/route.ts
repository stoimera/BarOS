import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { eventLocationAllowed, eventLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

const createPromoCodeSchema = z
  .object({
    code: z.string().min(3),
    event_id: z.string().uuid().optional(),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().positive(),
    max_redemptions: z.number().int().positive().optional(),
    max_uses_per_customer: z.number().int().positive().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.starts_at && v.ends_at) {
      const s = new Date(v.starts_at).getTime()
      const e = new Date(v.ends_at).getTime()
      if (!Number.isFinite(s) || !Number.isFinite(e)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid promo date range' })
      } else if (e <= s) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ends_at must be after starts_at' })
      }
    }
  })

export const GET = withSecurity(
  async (_req, { scopedLocationId }: { scopedLocationId?: string } = {}) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*, events(location_id)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rows = data || []
    const filtered = scopedLocationId
      ? rows.filter((row) => {
          const ev = (row as { events?: { location_id?: string | null } | null }).events
          const loc = ev?.location_id
          return eventLocationAllowed(loc, scopedLocationId)
        })
      : rows
    return NextResponse.json({ data: filtered })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'event',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createPromoCodeSchema>
    const supabase = await createClient()
    if (body.event_id) {
      const g = await eventLocationGuardResponse(supabase, body.event_id, scopedLocationId)
      if (g) return g
    }
    const { data, error } = await supabase
      .from('promo_codes')
      .insert([
        {
          code: body.code,
          event_id: body.event_id ?? null,
          discount_type: body.discount_type,
          discount_value: body.discount_value,
          max_redemptions: body.max_redemptions ?? 1,
          max_uses_per_customer: body.max_uses_per_customer ?? null,
          starts_at: body.starts_at ?? null,
          ends_at: body.ends_at ?? null,
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
    requirePermission: 'event_commerce.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createPromoCodeSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)
