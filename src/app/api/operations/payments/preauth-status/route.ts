import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    let q = supabase
      .from('tabs')
      .select('id, order_id, preauth_hold_cents, preauth_status, opened_at')
      .neq('preauth_status', 'none')
      .order('opened_at', { ascending: false })
      .limit(50)
    if (scopedLocationId) {
      const { data: orders } = await supabase.from('orders').select('id').eq('location_id', scopedLocationId).limit(500)
      const ids = (orders || []).map((o) => o.id).slice(0, 200)
      if (ids.length === 0) {
        return NextResponse.json({
          data: { enabled: true, tabs: [], message: 'No orders at this location for pre-auth scope.' },
        })
      }
      q = q.in('order_id', ids)
    }
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const tabs = data || []
    return NextResponse.json({
      data: {
        enabled: true,
        tabs,
        message:
          tabs.length === 0
            ? 'No tabs with pre-auth metadata; set preauth_hold_cents / preauth_status on tabs when integrating a processor.'
            : 'Pre-authorization metadata from tabs (Track 10.6).',
      },
    })
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
