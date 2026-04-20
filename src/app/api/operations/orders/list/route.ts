import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    let q = supabase.from('orders').select('*, order_items(*)').order('opened_at', { ascending: false }).limit(100)
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
    auditResourceType: 'booking',
  }
)
