import { createLogger } from '@/lib/logger'
import { recordSliEvent } from '@/lib/observability/sli'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.bookings')

const createBookingSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  party_size: z.number().int().positive(),
  notes: z.string().optional(),
})

// GET endpoint for fetching bookings with filtering and pagination
export const GET = withSecurity(
  async (req) => {
    try {
      // Extract query parameters for filtering and pagination
      const { searchParams } = new URL(req.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const status = searchParams.get('status') || ''
      const date_from = searchParams.get('date_from') || ''

      log.info('Bookings API: Starting GET request')

      // Validate required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Bookings API: Missing required environment variables')
        return NextResponse.json({ data: [], count: 0 })
      }

      // Initialize Supabase client for database operations
      log.info('Bookings API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection before proceeding
      const { error: testError } = await supabase.from('bookings').select('count').limit(1)

      if (testError) {
        log.error('Bookings API: Database connection failed:', testError)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Bookings API: Database connection successful, fetching bookings')

      // Build query with customer information joins
      let query = supabase.from('bookings').select(
        `
        *,
        customers!bookings_customer_id_fkey (
          id,
          name,
          email,
          phone
        )
      `,
        { count: 'exact' }
      )

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }
      // Apply date range filter
      if (date_from) {
        query = query.gte('booking_date', date_from)
      }

      // Apply pagination and ordering
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('booking_date', { ascending: true })

      const { data: bookings, error, count } = await query

      if (error) {
        log.error('Bookings API: Failed to fetch bookings from database:', error)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info(`Bookings API: Successfully fetched ${bookings?.length || 0} bookings from database`)

      // Transform database bookings to frontend-compatible format
      const transformedBookings =
        bookings?.map((booking: Record<string, unknown>) => ({
          ...booking,
          date: booking.booking_date as string,
          time: booking.start_time as string,
          booking_date: new Date(String(booking.booking_date)),
          created_at: new Date(String(booking.created_at)),
          updated_at: new Date(String(booking.updated_at)),
          customer: booking.customers || {
            id: (booking.customer_id as string) || 'unknown',
            name: 'Customer',
            email: '',
            phone: '',
            tags: [],
            notes: '',
            created_at: new Date(),
            updated_at: new Date(),
          },
        })) || []

      log.info('Bookings API: Returning transformed bookings from database')
      return NextResponse.json({
        data: transformedBookings,
        count: count || 0,
      })
    } catch (error) {
      log.error('Bookings API: Unexpected error:', error)
      return NextResponse.json({ data: [], count: 0 })
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

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createBookingSchema>
      log.info('Bookings API: POST request received:', data)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Bookings API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Validate required fields
      if (!data.customer_name || !data.date || !data.time || !data.party_size) {
        log.error('Bookings API: Missing required fields:', {
          customer_name: !!data.customer_name,
          date: !!data.date,
          time: !!data.time,
          party_size: !!data.party_size,
        })
        return NextResponse.json(
          {
            error:
              'Missing required fields: customer_name, date, time, and party_size are required',
          },
          { status: 400 }
        )
      }

      // Always try to use real database first
      log.info('Bookings API: Attempting to create booking in database')
      const supabase = await createClient()

      // First, find or create the customer
      let customerId: string

      if (data.customer_email) {
        // Try to find existing customer by email
        const { data: existingCustomer, error: findError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', data.customer_email)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          log.error('Bookings API: Error finding customer:', findError)
          return NextResponse.json({ error: findError.message }, { status: 500 })
        }

        if (existingCustomer) {
          customerId = existingCustomer.id
          log.info('Bookings API: Found existing customer:', customerId)
        } else {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert([
              {
                name: data.customer_name,
                email: data.customer_email,
                phone: data.customer_phone || null,
              },
            ])
            .select('id')
            .single()

          if (createError) {
            log.error('Bookings API: Error creating customer:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
          }

          customerId = newCustomer.id
          log.info('Bookings API: Created new customer:', customerId)
        }
      } else if (data.customer_phone) {
        // Try to find existing customer by phone
        const { data: existingCustomer, error: findError } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', data.customer_phone)
          .single()

        if (findError && findError.code !== 'PGRST116') {
          log.error('Bookings API: Error finding customer by phone:', findError)
          return NextResponse.json({ error: findError.message }, { status: 500 })
        }

        if (existingCustomer) {
          customerId = existingCustomer.id
          log.info('Bookings API: Found existing customer by phone:', customerId)
        } else {
          // Create new customer with phone only
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert([
              {
                name: data.customer_name,
                email: null,
                phone: data.customer_phone,
              },
            ])
            .select('id')
            .single()

          if (createError) {
            log.error('Bookings API: Error creating customer with phone:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
          }

          customerId = newCustomer.id
          log.info('Bookings API: Created new customer with phone:', customerId)
        }
      } else {
        return NextResponse.json(
          { error: 'Either customer email or phone is required' },
          { status: 400 }
        )
      }

      // Now create the booking with the customer_id
      const bookingData = {
        customer_id: customerId,
        booking_date: data.date,
        start_time: data.time,
        party_size: data.party_size,
        notes: data.notes || null,
        status: 'confirmed',
      }

      log.info('Bookings API: Creating booking with data:', bookingData)

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
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
        log.error('Bookings API: Failed to create booking in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
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

      log.info('Bookings API: Booking created successfully in database')
      recordSliEvent('booking_created', true)
      return NextResponse.json(transformedBooking)
    } catch (error) {
      log.error('Bookings API: Error creating booking:', error)
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
    validateBody: createBookingSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
