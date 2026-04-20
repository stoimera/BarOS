import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getTodayBookings } from '@/lib/bookings'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.today')

export const GET = withSecurity(
  async () => {
    try {
      log.info('Bookings Today API: Starting GET request')

      const todayBookings = await getTodayBookings()

      log.info('Bookings Today API: Today bookings fetched:', todayBookings?.length || 0)

      return NextResponse.json(todayBookings)
    } catch (error) {
      log.error('Bookings Today API: Error:', error)

      // Return empty array to prevent dashboard errors
      return NextResponse.json([])
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
