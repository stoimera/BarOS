import { NextResponse } from 'next/server'
import { getEventAnalyticsSummary, getEventsWithPerformance } from '@/lib/events'
import { withSecurity } from '@/lib/security/api-middleware'

export const GET = withSecurity(
  async () => {
    try {
      const [analyticsData, performancesData] = await Promise.all([
        getEventAnalyticsSummary(),
        getEventsWithPerformance(),
      ])

      return NextResponse.json({
        analytics: analyticsData,
        performances: performancesData,
      })
    } catch (error) {
      let message = 'Failed to fetch events analytics'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
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
