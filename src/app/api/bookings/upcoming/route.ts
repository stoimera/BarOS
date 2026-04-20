import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getUpcomingBookings } from '@/lib/bookings'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.upcoming')

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const limit = parseInt(searchParams.get('limit') || '10')

      const upcomingBookings = await getUpcomingBookings(limit)
      return NextResponse.json(upcomingBookings)
    } catch (error) {
      log.error('Upcoming bookings API error:', error)
      let message = 'Failed to fetch upcoming bookings'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)
