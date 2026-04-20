import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.events.[id].rsvps')

export const GET = withSecurity(
  async (_request, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events RSVPs API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Create Supabase client
      const supabase = await createClient()

      // Query RSVPs for the event
      const { data: rsvps, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })

      if (error) {
        log.error('Events RSVPs API: Failed to fetch RSVPs from database:', error)
        return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
      }

      // Transform RSVPs to include customer data (simplified)
      const rsvpsWithCustomer = (rsvps || []).map((rsvp) => ({
        ...rsvp,
        customer: {
          id: rsvp.user_id,
          name: 'Unknown Customer',
          email: '',
          phone: '',
          tags: [],
          notes: '',
          created_at: rsvp.created_at,
          updated_at: rsvp.updated_at,
        },
      }))

      return NextResponse.json({ rsvps: rsvpsWithCustomer })
    } catch (error) {
      log.error('Events RSVPs API: Error fetching RSVPs:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
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
