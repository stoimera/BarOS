import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getEventStats } from '@/lib/events'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.events.stats')

export const GET = withSecurity(
  async () => {
    try {
      log.info('Events Stats API: Starting GET request')

      const stats = await getEventStats()

      log.info('Events Stats API: Stats calculated:', stats)

      return NextResponse.json(stats)
    } catch (error) {
      log.error('Events Stats API: Error:', error)

      // Return default stats structure to prevent dashboard errors
      return NextResponse.json({
        total_events: 0,
        upcoming_events: 0,
        past_events: 0,
        total_rsvps: 0,
        average_attendance: 0,
      })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'event',
  }
)
