import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { handleApiError } from '@/utils/error-handling'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.staff')

interface StaffProfileRow {
  user_id?: string
  email?: string
  first_name?: string
  last_name?: string
  role?: string
  phone?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface StaffRow {
  id?: string
  position?: string
  hire_date?: string
  is_active?: boolean
  profile?: StaffProfileRow | null
}

export const GET = withSecurity(
  async (req) => {
    try {
      log.info('Staff API: Starting GET request')
      const supabase = await createApiClient()

      // Get query parameters for filtering
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search')
      const role = searchParams.get('role')
      const status = searchParams.get('status')

      log.info('Staff API: Query params:', { search, role, status })

      // Query staff with their profile information
      let query = supabase
        .from('staff')
        .select(
          `
        id,
        position,
        hire_date,
        is_active,
        profile:profile_id(
          id,
          user_id,
          first_name,
          last_name,
          email,
          role,
          phone,
          avatar_url,
          created_at,
          updated_at
        )
      `
        )
        .order('hire_date', { ascending: false })

      // Apply filters
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }

      if (search) {
        // Search in profile names and email
        query = query.or(
          `profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`
        )
      }

      const { data: staffData, error } = await query

      if (error) {
        log.error('Staff API: Error fetching staff:', error)
        return NextResponse.json(
          {
            error: 'Failed to fetch staff',
            details: error.message,
          },
          { status: 500 }
        )
      }

      // Transform data to match expected UserProfile format
      const staff =
        (staffData as StaffRow[] | null)?.map((member) => ({
          profile: member.profile ?? undefined,
          id: member.id, // Use staff.id, not profile.id
          user_id: member.profile?.user_id,
          email: member.profile?.email || '',
          first_name: member.profile?.first_name || '',
          last_name: member.profile?.last_name || '',
          name:
            `${member.profile?.first_name || ''} ${member.profile?.last_name || ''}`.trim() ||
            'Unknown',
          role: member.profile?.role || 'staff',
          phone: member.profile?.phone,
          avatar_url: member.profile?.avatar_url,
          position: member.position,
          hire_date: member.hire_date,
          is_active: member.is_active,
          created_at: member.profile?.created_at || '',
          updated_at: member.profile?.updated_at || '',
        })) || []

      log.info(`Staff API: Successfully fetched ${staff.length} staff members`)
      return NextResponse.json({ staff })
    } catch (error) {
      log.error('Staff API: Unexpected error:', error)
      const { error: message, status } = handleApiError(error)
      return NextResponse.json({ error: message }, { status })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'staff',
  }
)
