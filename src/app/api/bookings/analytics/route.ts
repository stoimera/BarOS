import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getBookingAnalytics } from '@/lib/bookings'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.analytics')

export const GET = withSecurity(
  async () => {
    try {
      const analytics = await getBookingAnalytics()
      return NextResponse.json(analytics)
    } catch (error) {
      log.error('Booking analytics API error:', error)
      let message = 'Failed to fetch booking analytics'
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
