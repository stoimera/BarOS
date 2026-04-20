import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marketing_consent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'compliance.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'customer',
  }
)
