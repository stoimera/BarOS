import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getBookingStats } from '@/lib/bookings'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.stats')

export const GET = withSecurity(
  async () => {
    try {
      log.info('Bookings Stats API: Starting GET request')

      const stats = await getBookingStats()

      log.info('Bookings Stats API: Stats calculated:', stats)

      return NextResponse.json(stats)
    } catch (error) {
      log.error('Bookings Stats API: Error:', error)

      log.info('Bookings Stats API: Returning default stats due to error')

      // Return default stats structure to prevent dashboard errors
      return NextResponse.json({
        total_bookings: 0,
        pending_bookings: 0,
        confirmed_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        average_party_size: 0,
        total_guests: 0,
      })
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
