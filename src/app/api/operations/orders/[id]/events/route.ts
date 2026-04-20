import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { orderLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async (_req, { routeContext, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()
    const guard = await orderLocationGuardResponse(supabase, params.id, scopedLocationId)
    if (guard) return guard
    const { data, error } = await supabase
      .from('order_events')
      .select('*')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false })

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
    auditResourceType: 'booking',
  }
)
