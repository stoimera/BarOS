import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendBookingConfirmation } from '@/lib/email'
import { createNotification } from '@/lib/notifications'
import { format } from 'date-fns'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.bookings.[id]')

const updateBookingSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  party_size: z.number().int().positive().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  table_id: z.string().uuid().nullable().optional(),
  walk_in: z.boolean().optional(),
  location_id: z.string().uuid().nullable().optional(),
})

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Bookings API: GET request for booking ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Bookings API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Bookings API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      const { data: booking, error } = await supabase
        .from('bookings')
        .select(
          `
        *,
        customers!bookings_customer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `
        )
        .eq('id', id)
        .single()

      if (error) {
        log.error('Bookings API: Failed to fetch booking from database:', error)
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Transform the data to match the expected format
      const transformedBooking = {
        ...booking,
        date: booking.booking_date,
        time: booking.start_time,
        booking_date: new Date(booking.booking_date),
        created_at: new Date(booking.created_at),
        updated_at: new Date(booking.updated_at),
        customer: booking.customers || {
          id: booking.customer_id || 'unknown',
          name: 'Customer',
          email: '',
          phone: '',
          tags: [],
          notes: '',
          created_at: new Date(),
          updated_at: new Date(),
        },
      }

      log.info('Bookings API: Booking fetched successfully from database')
      return NextResponse.json(transformedBooking)
    } catch (error) {
      log.error('Bookings API: Error fetching booking:', error)
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
    auditResourceType: 'booking',
  }
)

export const PUT = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      const data = validatedBody as z.infer<typeof updateBookingSchema>
      log.info('bookings_put', { id, party_size: data.party_size, status: data.status })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Bookings API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Bookings API: Attempting to update booking in database')
      const supabase = await createClient()

      // First, get the existing booking to check if it exists and get customer info
      const { data: existingBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(
          `
        *,
        customers!bookings_customer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `
        )
        .eq('id', id)
        .single()

      if (fetchError) {
        log.error('Bookings API: Failed to fetch existing booking:', fetchError)
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      if (!existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Transform the updates to match database schema
      const dbUpdates: Record<string, unknown> = {}
      if (data.date !== undefined) dbUpdates.booking_date = data.date
      if (data.time !== undefined) dbUpdates.start_time = data.time
      if (data.party_size !== undefined) dbUpdates.party_size = data.party_size
      if (data.status !== undefined) dbUpdates.status = data.status
      if (data.notes !== undefined) dbUpdates.notes = data.notes
      if (data.table_id !== undefined) dbUpdates.table_id = data.table_id
      if (data.walk_in !== undefined) dbUpdates.walk_in = data.walk_in
      if (data.location_id !== undefined) dbUpdates.location_id = data.location_id

      // Add updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString()

      log.info('Bookings API: Transformed update data:', dbUpdates)

      // Check if there are any updates to make
      if (Object.keys(dbUpdates).length === 0) {
        log.info('Bookings API: No updates to make, returning existing booking')
        const transformedBooking = {
          ...existingBooking,
          date: existingBooking.booking_date,
          time: existingBooking.start_time,
          booking_date: new Date(existingBooking.booking_date),
          created_at: new Date(existingBooking.created_at),
          updated_at: new Date(existingBooking.updated_at),
          customer: existingBooking.customers || {
            id: existingBooking.customer_id,
            name: 'Customer',
            email: '',
            phone: '',
            tags: [],
            notes: '',
            created_at: new Date(),
            updated_at: new Date(),
          },
        }
        return NextResponse.json(transformedBooking)
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id)
        .select(
          `
        *,
        customers!bookings_customer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `
        )
        .single()

      if (error) {
        log.error('Bookings API: Failed to update booking in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Transform the data to match the expected format
      const transformedBooking = {
        ...booking,
        date: booking.booking_date,
        time: booking.start_time,
        booking_date: new Date(booking.booking_date),
        created_at: new Date(booking.created_at),
        updated_at: new Date(booking.updated_at),
        customer: booking.customers || {
          id: booking.customer_id,
          name: 'Customer',
          email: '',
          phone: '',
          tags: [],
          notes: '',
          created_at: new Date(),
          updated_at: new Date(),
        },
      }

      // Send confirmation email and notification if booking status is being changed to 'confirmed'
      if (data.status === 'confirmed' && booking.customers?.email) {
        try {
          // Send email confirmation
          await sendBookingConfirmation({
            customerName: booking.customers.name || 'Customer',
            customerEmail: booking.customers.email,
            bookingDate: format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy'),
            bookingTime: booking.start_time,
            partySize: booking.party_size,
            bookingId: booking.id,
            barName: 'Your Bar', // You can customize this
          })
          log.info('Booking confirmation email sent to:', booking.customers.email)

          // Create in-app notification for the customer
          try {
            await createNotification({
              user_id: booking.customer_id,
              title: 'Booking Confirmed!',
              message: `Your booking for ${format(new Date(booking.booking_date), 'EEEE, MMMM d')} at ${booking.start_time} has been confirmed.`,
              type: 'success',
              category: 'customer',
              action_url: `/customer/bookings/${booking.id}`,
              action_text: 'View Booking',
              metadata: {
                booking_id: booking.id,
                booking_date: booking.booking_date,
                booking_time: booking.start_time,
                party_size: booking.party_size,
              },
            })
            log.info('Booking confirmation notification created for customer:', booking.customer_id)
          } catch (notificationError) {
            log.error('Failed to create booking confirmation notification:', notificationError)
            // Don't throw error - booking update should still succeed even if notification fails
          }
        } catch (emailError) {
          log.error('Failed to send booking confirmation email:', emailError)
          // Don't throw error - booking update should still succeed even if email fails
        }
      }

      log.info('Bookings API: Booking updated successfully in database')
      return NextResponse.json(transformedBooking)
    } catch (error) {
      log.error('Bookings API: Error updating booking:', error)
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
    validateBody: updateBookingSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)

export const DELETE = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Bookings API: DELETE request for booking ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Bookings API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Bookings API: Attempting to delete booking from database')
      const supabase = await createClient()

      const { error } = await supabase.from('bookings').delete().eq('id', id)

      if (error) {
        log.error('Bookings API: Failed to delete booking from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Bookings API: Booking deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Bookings API: Error deleting booking:', error)
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
    auditResourceType: 'booking',
  }
)
