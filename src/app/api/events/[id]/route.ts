import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.events.[id]')

const updateEventByIdSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  location: z.string().optional(),
  category: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
})

export const GET = withSecurity(
  async (request, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Create Supabase client
      const supabase = await createClient()

      // Query the database for the event
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        log.error('Events API: Failed to fetch event from database:', error)
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      // Transform data to include all required fields
      const eventWithDetails = {
        ...event,
        event_date: event.event_date,
        date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        time: event.start_time
          ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`
          : null,
        category: event.category,
        status: event.is_active ? 'published' : 'draft',
        total_rsvps: event.current_rsvps || 0,
        going_count: 0,
        interested_count: 0,
        checked_in_count: 0,
        creator_name: 'Unknown',
        rsvps: [],
      }

      return NextResponse.json({ event: eventWithDetails })
    } catch (error) {
      log.error('Events API: Error fetching event:', error)
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

export const PUT = withSecurity(
  async (_request, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      const data = validatedBody as z.infer<typeof updateEventByIdSchema>
      log.info('events_put', { id })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Events API: Attempting to update event in database')
      const supabase = await createClient()

      // Transform the updates to match database schema
      const dbUpdates: Record<string, unknown> = {}
      if (data.title) dbUpdates.title = data.title
      if (data.description) dbUpdates.description = data.description
      if (data.date) dbUpdates.event_date = data.date
      if (data.start_time) dbUpdates.start_time = data.start_time
      if (data.end_time) dbUpdates.end_time = data.end_time
      if (data.location) dbUpdates.location = data.location
      if (data.category) dbUpdates.category = data.category
      if (data.capacity) dbUpdates.max_capacity = data.capacity
      if (data.price) dbUpdates.price = data.price

      log.info('Events API: Transformed update data:', dbUpdates)

      const { data: event, error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        log.error('Events API: Failed to update event in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Events API: Event updated successfully in database:', event)

      // Transform the response to match expected format
      const eventWithDetails = {
        ...event,
        event_date: event.event_date,
        date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        time: event.start_time
          ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`
          : null,
        category: event.category,
        status: event.is_active ? 'published' : 'draft',
        total_rsvps: event.current_rsvps || 0,
        going_count: 0,
        interested_count: 0,
        checked_in_count: 0,
        creator_name: 'Unknown',
        rsvps: [],
      }

      return NextResponse.json({ event: eventWithDetails })
    } catch (error) {
      log.error('Events API: Error updating event:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateEventByIdSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)

export const DELETE = withSecurity(
  async (request, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      log.info('Events API: DELETE request received for event ID:', params.id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Events API: Attempting to delete event from database')
      const supabase = await createClient()

      // First check if the event exists
      const { error: checkError } = await supabase
        .from('events')
        .select('id')
        .eq('id', params.id)
        .single()

      if (checkError) {
        log.error('Events API: Error checking if event exists:', checkError)
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      // Delete the event
      const { error } = await supabase.from('events').delete().eq('id', params.id)

      if (error) {
        log.error('Events API: Failed to delete event from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Events API: Event deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Events API: Error deleting event:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'event',
  }
)
