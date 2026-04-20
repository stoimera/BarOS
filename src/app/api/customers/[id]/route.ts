import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.customers.[id]')

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  total_visits: z.number().int().nonnegative().optional(),
  loyalty_points: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
})

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Customers API: GET request for customer ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Customers API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Customers API: Attempting to fetch customer from database')
      const supabase = await createClient()

      log.info('Customers API: Querying customers table for ID:', id)
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        log.error('Customers API: Failed to fetch customer from database:', error)
        log.error('Customers API: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!customer) {
        log.error('Customers API: Customer not found for ID:', id)
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      log.info('Customers API: Customer fetched successfully from database:', customer)
      return NextResponse.json(customer)
    } catch (error) {
      log.error('Customers API: Error fetching customer:', error)
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
    auditResourceType: 'customer',
  }
)

export const PUT = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      const data = validatedBody as z.infer<typeof updateCustomerSchema>
      log.info('customers_put', { id })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Customers API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Customers API: Attempting to update customer in database')
      const supabase = await createClient()

      // Remove the id from the updates since we're updating by id
      const updates = { ...data }

      log.info('Customers API: Updates to apply:', updates)

      const { data: customer, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        log.error('Customers API: Failed to update customer in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      log.info('Customers API: Customer updated successfully in database')
      return NextResponse.json(customer)
    } catch (error) {
      log.error('Customers API: Error updating customer:', error)
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
    validateBody: updateCustomerSchema,
    auditAction: 'update',
    auditResourceType: 'customer',
  }
)

export const DELETE = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Customers API: DELETE request for customer ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Customers API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Customers API: Attempting to delete customer from database')
      const supabase = await createClient()

      // First check if the customer exists
      const { error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError) {
        log.error('Customers API: Error checking if customer exists:', checkError)
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      // Delete the customer
      const { error } = await supabase.from('customers').delete().eq('id', id)

      if (error) {
        log.error('Customers API: Failed to delete customer from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Customers API: Customer deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Customers API: Error deleting customer:', error)
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
    auditResourceType: 'customer',
  }
)
