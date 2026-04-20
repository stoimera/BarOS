import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'

/**
 * Returns the staff row linked to the current user (for redemptions, scheduling, etc.).
 * Admins without a staff row get linkedStaff: null and must pick a staff id client-side when redeeming.
 */
export const GET = withSecurity(
  async (_req, { user }) => {
    try {
      const supabase = await createClient()
      const { data: staffRows, error } = await supabase
        .from('staff')
        .select('id, position, is_active, created_at')
        .eq('profile_id', user.profileId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        // Do not fail the whole rewards page when staff linkage lookup is degraded.
        return NextResponse.json({
          role: user.role,
          linkedStaff: null,
        })
      }

      const staff = (staffRows ?? []).find((row) => row.is_active !== false) ?? staffRows?.[0] ?? null

      return NextResponse.json({
        role: user.role,
        linkedStaff: staff?.id
          ? { id: staff.id, position: staff.position ?? 'Staff' }
          : null,
      })
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'user',
  }
)
