import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { updateRSVPStatus } from '@/lib/events'
import { RSVPStatus } from '@/types/common'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.rsvps.[id].status')

const updateRsvpStatusSchema = z.object({
  status: z.enum(['going', 'interested', 'not_going']),
})

export const PUT = withSecurity(
  async (_request, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { status } = validatedBody as z.infer<typeof updateRsvpStatusSchema>
      const rsvp = await updateRSVPStatus(params.id, status as RSVPStatus)
      return NextResponse.json({ rsvp })
    } catch (statusError) {
      log.error('Failed to update RSVP status:', statusError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateRsvpStatusSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)
