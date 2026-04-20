import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const [plansRes, countRes] = await Promise.all([
      supabase.from('membership_plans').select('id, name, billing_interval, is_active').eq('is_active', true),
      supabase.from('customer_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    if (plansRes.error) return NextResponse.json({ error: plansRes.error.message }, { status: 500 })
    if (countRes.error) return NextResponse.json({ error: countRes.error.message }, { status: 500 })
    const activeMembershipRows = countRes.count ?? 0
    return NextResponse.json({
      data: {
        provider: 'internal',
        plans: plansRes.data || [],
        subscriptions_active: activeMembershipRows,
        message: 'Plans and active member counts for this venue.',
      },
    })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'customer',
  }
)
