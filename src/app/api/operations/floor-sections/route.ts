import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const createSectionSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  location_id: z.string().uuid().nullable().optional(),
})

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    let q = supabase.from('floor_sections').select('*').order('name', { ascending: true })
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
    requirePermission: 'orders.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof createSectionSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('floor_sections')
      .insert([
        {
          name: body.name,
          location: body.location ?? null,
          location_id: body.location_id ?? null,
        },
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    requirePermission: 'locations.write',
    rateLimitType: 'strict',
    validateBody: createSectionSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
