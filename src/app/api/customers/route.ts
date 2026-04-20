import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createUserSupabaseClient } from '@/utils/supabase/server-user'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.customers')

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
})

// GET endpoint for fetching customers with search and pagination
export const GET = withSecurity(
  async (req) => {
    try {
      // Extract query parameters for search and pagination
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')

      log.info('Customers API: Starting GET request')

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        log.error('Customers API: Missing Supabase URL or anon key')
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Customers API: Attempting to connect to Supabase database')
      const supabase = await createUserSupabaseClient()

      const { error: testError } = await supabase.from('customers').select('id').limit(1)

      if (testError) {
        log.error('Customers API: Database connection failed:', testError)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Customers API: Database connection successful, fetching customers')

      // Plain select avoids brittle PostgREST embed/FK names; total_visits is maintained on customers.
      let query = supabase.from('customers').select('*', { count: 'exact' })

      // Add search filter for name and email fields
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply pagination with range and ordering
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data: customers, error, count } = await query

      if (error) {
        log.error('Customers API: Failed to fetch customers from database:', error)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info(
        `Customers API: Successfully fetched ${customers?.length || 0} customers from database`
      )

      const parseDate = (v: unknown): Date => {
        if (v == null || v === '') return new Date(0)
        const d = new Date(String(v))
        return Number.isNaN(d.getTime()) ? new Date(0) : d
      }

      const transformedCustomers =
        customers?.map((customer: Record<string, unknown>) => ({
          ...customer,
          created_at: parseDate(customer.created_at),
          updated_at: parseDate(customer.updated_at),
          birthday:
            customer.date_of_birth != null && customer.date_of_birth !== ''
              ? parseDate(customer.date_of_birth)
              : customer.birthday != null && customer.birthday !== ''
                ? parseDate(customer.birthday)
                : undefined,
          calculated_visits: Number(customer.total_visits) || 0,
        })) || []

      log.info('Customers API: Returning transformed customers from database')
      return NextResponse.json({
        data: transformedCustomers,
        count: count || 0,
      })
    } catch (error) {
      log.error('Customers API: Unexpected error:', error)
      return NextResponse.json({ data: [], count: 0 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'customer',
  }
)

// POST endpoint for creating new customers
export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createCustomerSchema>
      log.info('Customers API: POST request received:', data)

      // Validate required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Customers API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Initialize Supabase client and create customer
      log.info('Customers API: Attempting to create customer in database')
      const supabase = await createClient()

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([data])
        .select()
        .single()

      if (error) {
        log.error('Customers API: Failed to create customer in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Customers API: Customer created successfully in database:', customer)
      return NextResponse.json(customer)
    } catch (error) {
      log.error('Customers API: Error creating customer:', error)
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
    validateBody: createCustomerSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
