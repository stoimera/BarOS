import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { updateRSVPCheckIn } from '@/lib/events'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.rsvps.[id].checkin')

const updateRsvpCheckinSchema = z.object({
  checkedIn: z.boolean(),
})

export const PUT = withSecurity(
  async (_request, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { checkedIn } = validatedBody as z.infer<typeof updateRsvpCheckinSchema>
      const rsvp = await updateRSVPCheckIn(params.id, checkedIn)
      return NextResponse.json({ rsvp })
    } catch (checkinError) {
      log.error('Failed to check in RSVP:', checkinError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateRsvpCheckinSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)
