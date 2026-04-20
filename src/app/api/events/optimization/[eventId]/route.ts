import { NextResponse } from 'next/server'
import { getEventOptimization } from '@/lib/events'
import { withSecurity } from '@/lib/security/api-middleware'

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { eventId: string } }
      const optimizationData = await getEventOptimization(params.eventId)
      return NextResponse.json(optimizationData)
    } catch (error) {
      let message = 'Failed to fetch event optimization'
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
