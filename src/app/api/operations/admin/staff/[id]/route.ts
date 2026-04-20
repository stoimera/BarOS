import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const patchStaffLocationSchema = z.object({
  location_id: z.string().uuid().nullable(),
})

/**
 * Admin: assign staff primary location (Track 5.6).
 */
export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof patchStaffLocationSchema>
    const supabase = await createClient()

    if (body.location_id) {
      const { data: loc, error: locErr } = await supabase.from('locations').select('id').eq('id', body.location_id).maybeSingle()
      if (locErr) return NextResponse.json({ error: locErr.message }, { status: 500 })
      if (!loc?.id) return NextResponse.json({ error: 'Unknown location_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('staff')
      .update({ location_id: body.location_id })
      .eq('id', params.id)
      .select('id, profile_id, location_id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    requirePermission: 'locations.write',
    rateLimitType: 'strict',
    validateBody: patchStaffLocationSchema,
    auditAction: 'update',
    auditResourceType: 'organization',
  }
)
