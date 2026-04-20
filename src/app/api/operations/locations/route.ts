import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'locations.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'organization',
  }
)
