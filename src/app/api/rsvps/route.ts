import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.rsvps')

const createRsvpSchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['going', 'interested', 'not_going']).optional(),
  special_requests: z.string().optional().nullable(),
})

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    try {
      const {
        event_id,
        user_id,
        status = 'going',
        special_requests,
      } = validatedBody as z.infer<typeof createRsvpSchema>

      if (user.role === 'customer' && user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Validate required fields
      if (!event_id || !user_id) {
        return NextResponse.json({ error: 'Event ID and User ID are required' }, { status: 400 })
      }

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('RSVP API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Create Supabase client
      const supabase = await createClient()

      // Check if user already has an RSVP for this event
      const { data: existingRSVP, error: checkError } = await supabase
        .from('rsvps')
        .select('id, status')
        .eq('event_id', event_id)
        .eq('user_id', user_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        log.error('RSVP API: Error checking existing RSVP:', checkError)
        return NextResponse.json({ error: 'Failed to check existing RSVP' }, { status: 500 })
      }

      let rsvpId: string

      if (existingRSVP) {
        // Update existing RSVP
        const { data: updatedRSVP, error: updateError } = await supabase
          .from('rsvps')
          .update({
            status,
            special_requests,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRSVP.id)
          .select()
          .single()

        if (updateError) {
          log.error('RSVP API: Failed to update RSVP:', updateError)
          return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
        }

        rsvpId = updatedRSVP.id
      } else {
        // Create new RSVP
        const rsvpData = {
          event_id,
          user_id,
          status,
          special_requests,
          checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: newRSVP, error: createError } = await supabase
          .from('rsvps')
          .insert([rsvpData])
          .select()
          .single()

        if (createError) {
          log.error('RSVP API: Failed to create RSVP:', createError)
          return NextResponse.json({ error: 'Failed to create RSVP' }, { status: 500 })
        }

        rsvpId = newRSVP.id
      }

      // Update the event's current_rsvps count
      const { data: eventRSVPs, error: countError } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', event_id)
        .eq('status', 'going')

      if (countError) {
        log.error('RSVP API: Failed to count RSVPs:', countError)
        // Don't fail the request, just log the error
      } else {
        // Update the event's current_rsvps field
        const { error: updateEventError } = await supabase
          .from('events')
          .update({
            current_rsvps: eventRSVPs?.length || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event_id)

        if (updateEventError) {
          log.error('RSVP API: Failed to update event RSVP count:', updateEventError)
          // Don't fail the request, just log the error
        }
      }

      // Get the updated event data
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('title, event_date, location, current_rsvps')
        .eq('id', event_id)
        .single()

      if (eventError) {
        log.error('RSVP API: Failed to fetch updated event:', eventError)
      }

      return NextResponse.json({
        success: true,
        rsvp_id: rsvpId,
        message: existingRSVP ? 'RSVP updated successfully' : 'RSVP created successfully',
        event: event
          ? {
              title: event.title,
              date: event.event_date,
              location: event.location,
              current_rsvps: event.current_rsvps,
            }
          : null,
      })
    } catch (error) {
      log.error('RSVP API: Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'strict',
    validateBody: createRsvpSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)

export const GET = withSecurity(
  async (req, { user }) => {
    try {
      const { searchParams } = new URL(req.url)
      const event_id = searchParams.get('event_id')
      const requestedUserId = searchParams.get('user_id')
      // Customer role can only read own RSVPs; force scoping to authenticated user
      // instead of failing when UI passes a different internal/profile identifier.
      const user_id = user.role === 'customer' ? user.id : requestedUserId

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('RSVP API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Create Supabase client
      const supabase = await createClient()

      let query = supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false })

      if (event_id) {
        query = query.eq('event_id', event_id)
      }

      if (user_id) {
        query = query.eq('user_id', user_id)
      }

      const { data: rsvps, error } = await query

      if (error) {
        log.error('RSVP API: Failed to fetch RSVPs:', error)
        return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
      }

      return NextResponse.json({ rsvps: rsvps || [] })
    } catch (error) {
      log.error('RSVP API: Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
