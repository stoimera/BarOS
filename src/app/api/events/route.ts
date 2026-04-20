import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.events')

interface EventRsvpRow {
  status?: string
  checkin_time?: string | null
}

interface EventRow {
  id?: string
  title?: string
  description?: string
  event_date?: string
  start_time?: string
  end_time?: string
  location?: string
  category?: string
  max_capacity?: number
  current_rsvps?: number
  price?: number
  is_active?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
  rsvps?: EventRsvpRow[]
}

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  date: z.string().min(1),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  location: z.string().min(1),
  category: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
})

const updateEventSchema = z.object({
  id: z.string().uuid(),
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

// GET endpoint for fetching events with filtering and pagination
export const GET = withSecurity(
  async (req, { user }) => {
    try {
      // Extract query parameters for filtering and pagination
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const dateFrom = searchParams.get('dateFrom') || ''
      const dateTo = searchParams.get('dateTo') || ''
      const location = searchParams.get('location') || ''
      const status = searchParams.get('status') || ''

      // Validate required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ events: [] })
      }

      // Initialize Supabase client for database operations
      const supabase = await createClient()

      // Test database connection before proceeding
      const { error: testError } = await supabase.from('events').select('count').limit(1)

      if (testError) {
        log.error('Events API: Database connection failed:', testError)
        return NextResponse.json({ events: [] })
      }

      // Build base query with RSVP relationships
      let query = supabase
        .from('events')
        .select(
          `
        *,
        rsvps (
          id,
          status,
          checkin_time
        )
      `
        )
        .order('event_date', { ascending: true })

      // Apply search filter for event titles
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      // Apply date range filters
      if (dateFrom) {
        query = query.gte('event_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('event_date', dateTo)
      }

      // Apply location filter
      if (location) {
        query = query.ilike('location', `%${location}%`)
      }

      // Apply status filter (published/draft); customers only see published events
      if (user.role === 'customer') {
        query = query.eq('is_active', true)
      } else if (status) {
        // Map status to is_active field
        const isActive = status === 'published'
        query = query.eq('is_active', isActive)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: events, error } = await query

      if (error) {
        log.error('Events API: Failed to fetch events from database:', error)
        return NextResponse.json({ events: [] })
      }

      // Transform database events to frontend-compatible format
      const transformedEvents =
        (events as EventRow[] | null)?.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date, // Keep the original event_date field
          date: event.event_date, // Also include date for frontend compatibility
          start_time: event.start_time, // Include separate start_time for frontend compatibility
          end_time: event.end_time, // Include separate end_time for frontend compatibility
          time: event.start_time
            ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`
            : null,
          location: event.location,
          category: event.category,
          max_capacity: event.max_capacity,
          current_rsvps: event.current_rsvps,
          price: event.price,
          is_active: event.is_active,
          created_by: event.created_by,
          created_at: event.created_at,
          updated_at: event.updated_at,
          status: event.is_active ? 'published' : 'draft',
          total_rsvps: event.rsvps?.length || event.current_rsvps || 0,
          going_count: event.rsvps?.filter((r) => r.status === 'going').length || 0,
          interested_count: event.rsvps?.filter((r) => r.status === 'interested').length || 0,
          checked_in_count: event.rsvps?.filter((r) => r.checkin_time).length || 0,
          creator_name: 'Unknown',
          rsvps: event.rsvps || [],
        })) || []

      return NextResponse.json({ events: transformedEvents })
    } catch (error) {
      log.error('Events API: Unexpected error:', error)
      return NextResponse.json({ events: [] })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'event',
  }
)

// POST endpoint for creating new events
export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createEventSchema>

      // Validate required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Initialize Supabase client
      const supabase = await createClient()

      // Get an existing profile ID to use for created_by
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1)

      // Use a default profile ID if none found, or make created_by optional
      const profileId = profiles && profiles.length > 0 ? profiles[0].id : null

      // Transform the data to match database schema
      const dbEvent: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        event_date: data.date, // Map date to event_date
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location,
        category: data.category,
        max_capacity: data.capacity,
        price: data.price,
        is_active: true,
      }

      // Only add created_by if we have a profile ID
      if (profileId) {
        dbEvent.created_by = profileId
      }

      // Insert the new event into the database
      const { data: event, error } = await supabase
        .from('events')
        .insert([dbEvent])
        .select()
        .single()

      if (error) {
        log.error('Events API: Failed to create event in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

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
      log.error('Events API: Error creating event:', error)
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
    validateBody: createEventSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)

export const PUT = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof updateEventSchema>
      const { id, ...updates } = data

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first

      const supabase = await createClient()

      // Transform the updates to match database schema
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title) dbUpdates.title = updates.title
      if (updates.description) dbUpdates.description = updates.description
      if (updates.date) dbUpdates.event_date = updates.date
      if (updates.start_time) dbUpdates.start_time = updates.start_time
      if (updates.end_time) dbUpdates.end_time = updates.end_time
      if (updates.location) dbUpdates.location = updates.location
      if (updates.category) dbUpdates.category = updates.category
      if (updates.capacity) dbUpdates.max_capacity = updates.capacity
      if (updates.price) dbUpdates.price = updates.price

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
    validateBody: updateEventSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)

export const DELETE = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
      }

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Events API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first

      const supabase = await createClient()

      // First check if the event exists
      const { error: checkError } = await supabase.from('events').select('id').eq('id', id).single()

      if (checkError) {
        log.error('Events API: Error checking if event exists:', checkError)
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      // Delete the event
      const { error } = await supabase.from('events').delete().eq('id', id)

      if (error) {
        log.error('Events API: Failed to delete event from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

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
