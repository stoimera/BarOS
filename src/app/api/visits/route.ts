import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.visits')

const createVisitSchema = z.object({
  customer_id: z.string().uuid(),
  staff_id: z.string().uuid().optional().nullable(),
  visit_type: z.string().min(1),
  visit_date: z.string().min(1),
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  total_spent: z.number().nonnegative().optional(),
})

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const customer_id = searchParams.get('customer_id') || ''
      const staff_id = searchParams.get('staff_id') || ''
      const visit_type = searchParams.get('visit_type') || ''
      const date_from = searchParams.get('date_from') || ''
      const date_to = searchParams.get('date_to') || ''
      const has_checkout = searchParams.get('has_checkout') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''

      log.info('Visits API: Starting GET request')
      log.info('Visits API: Search params:', {
        customer_id,
        staff_id,
        visit_type,
        date_from,
        date_to,
        has_checkout,
        page,
        limit,
        search,
        status,
      })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Visits API: Missing required environment variables')
        return NextResponse.json({ data: [], count: 0 })
      }

      // Always try to use real database first
      log.info('Visits API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('visits').select('count').limit(1)

      if (testError) {
        log.error('Visits API: Database connection failed:', testError)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Visits API: Database connection successful, fetching visits')

      // Build query
      let query = supabase.from('visits').select(
        `
        *,
        customer:customers(id, name, email, phone),
        staff:staff(id, position)
      `,
        { count: 'exact' }
      )

      // Add filters
      if (customer_id) {
        query = query.eq('customer_id', customer_id)
      }

      if (staff_id) {
        query = query.eq('staff_id', staff_id)
      }

      if (visit_type) {
        query = query.eq('visit_type', visit_type)
      }

      if (date_from) {
        query = query.gte('visit_date', date_from)
      }

      if (date_to) {
        query = query.lte('visit_date', date_to)
      }

      if (has_checkout !== '') {
        if (has_checkout === 'true') {
          query = query.not('check_out_time', 'is', null)
        } else {
          query = query.is('check_out_time', null)
        }
      }

      // Add search filter
      if (search) {
        query = query.or(`customer.name.ilike.%${search}%,customer.email.ilike.%${search}%`)
      }

      // Add status filter
      if (status) {
        if (status === 'checked_in') {
          query = query.not('check_in_time', 'is', null)
        } else if (status === 'pending') {
          query = query.is('check_in_time', null)
        }
      }

      // Add pagination
      const offset = (page - 1) * limit
      query = query.order('visit_date', { ascending: false }).range(offset, offset + limit - 1)

      log.info('Visits API: Executing query...')
      const { data: visits, error, count } = await query

      if (error) {
        log.error('Visits API: Failed to fetch visits from database:', error)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info(
        `Visits API: Successfully fetched ${visits?.length || 0} visits from database (total: ${count})`
      )
      log.info('Visits API: Raw visits data:', visits)

      // Transform the data to match the expected format
      const transformedVisits =
        visits?.map((visit: Record<string, unknown>) => ({
          ...visit,
          visit_date: new Date(String(visit.visit_date)),
          check_in_time: visit.check_in_time ? new Date(String(visit.check_in_time)) : null,
          check_out_time: visit.check_out_time ? new Date(String(visit.check_out_time)) : null,
          created_at: new Date(String(visit.created_at)),
          updated_at: new Date(String(visit.updated_at)),
        })) || []

      log.info('Visits API: Transformed visits:', transformedVisits)
      log.info('Visits API: Returning transformed visits from database')
      return NextResponse.json({
        data: transformedVisits,
        count: count || 0,
      })
    } catch (error) {
      log.error('Visits API: Unexpected error:', error)
      return NextResponse.json({ data: [], count: 0 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'visit',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createVisitSchema>
      log.info('Visits API: POST request received:', data)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Visits API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Visits API: Attempting to create visit in database')
      const supabase = await createClient()

      const { data: visit, error } = await supabase.from('visits').insert([data]).select().single()

      if (error) {
        log.error('Visits API: Failed to create visit in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Visits API: Visit created successfully in database:', visit)
      return NextResponse.json(visit)
    } catch (error) {
      log.error('Visits API: Error creating visit:', error)
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
    validateBody: createVisitSchema,
    auditAction: 'create',
    auditResourceType: 'visit',
  }
)
