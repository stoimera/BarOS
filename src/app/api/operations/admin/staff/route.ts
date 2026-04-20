import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

/**
 * Admin: list staff with assigned location (Track 5.6).
 */
export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('staff')
      .select(
        `
        id,
        profile_id,
        position,
        location_id,
        profile:profile_id(id, email, first_name, last_name, role)
      `
      )
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    requirePermission: 'locations.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'organization',
  }
)
