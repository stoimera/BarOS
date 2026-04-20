import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getShiftsByStaff, getStaffMemberByUserId } from '@/lib/schedule'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.schedule.my-shifts')

export const GET = withSecurity(
  async (_req, { user }) => {
    try {
      log.info('My Shifts API: Starting GET request')

      try {
        // Get the staff member record for the current user
        const staffMember = await getStaffMemberByUserId(user.id)

        if (!staffMember) {
          log.info('My Shifts API: No staff record found for user, returning empty shifts')
          return NextResponse.json({
            shifts: [],
          })
        }

        log.info('My Shifts API: Fetching shifts for staff member:', staffMember.id)

        // Fetch shifts for this staff member
        const shifts = await getShiftsByStaff(staffMember.id)

        return NextResponse.json({
          shifts: shifts || [],
        })
      } catch (error) {
        log.error('Error fetching user shifts:', error)
        // Return empty shifts array instead of error to prevent page crash
        return NextResponse.json({
          shifts: [],
          error: 'Failed to fetch user shifts, but page can still function',
        })
      }
    } catch (error) {
      log.error('Error in my-shifts endpoint:', error)
      // Return empty shifts array instead of error to prevent page crash
      return NextResponse.json({
        shifts: [],
        error: 'Failed to fetch user shifts, but page can still function',
      })
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
