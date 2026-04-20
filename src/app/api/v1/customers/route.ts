import { createLogger } from '@/lib/logger'

const log = createLogger('api.v1.customers')

/**
 * Customers API v1 - Secure Implementation Example
 *
 * This is an example of how to use the security middleware in API routes
 */

import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z, flattenError } from 'zod'
import { commonSchemas, sanitizeString } from '@/lib/security/validation'
import { auditCreate } from '@/lib/security/audit'
import { encryptEmail, encryptPhone, decryptEmail, decryptPhone } from '@/lib/security/encryption'
import { createPaginatedResponse } from '@/lib/api/pagination'

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeString),
  email: z.string().email().toLowerCase().trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  date_of_birth: commonSchemas.date.optional(),
  address: z.string().max(500).transform(sanitizeString).optional(),
  notes: z.string().max(1000).transform(sanitizeString).optional(),
})

const querySchema = z.object({
  search: z.string().optional(),
  page: commonSchemas.pagination.shape.page,
  limit: commonSchemas.pagination.shape.limit,
})

// GET /api/v1/customers - List customers with security
export const GET = withSecurity(
  async (req) => {
    const { searchParams } = new URL(req.url)

    // Validate query parameters
    const queryResult = querySchema.safeParse({
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: flattenError(queryResult.error) },
        { status: 400 }
      )
    }

    const { search, page, limit } = queryResult.data
    const supabase = await createClient()

    // Build query
    let query = supabase.from('customers').select('*', { count: 'exact' }).is('deleted_at', null) // Exclude soft-deleted records

    // Add search filter
    if (search) {
      const sanitizedSearch = sanitizeString(search)
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: customers, error, count } = await query

    if (error) {
      log.error('Failed to fetch customers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers', message: error.message },
        { status: 500 }
      )
    }

    // Decrypt sensitive data before sending to client
    const decryptedCustomers = (customers || []).map((customer) => ({
      ...customer,
      email: customer.email ? decryptEmail(customer.email) : customer.email,
      phone: customer.phone ? decryptPhone(customer.phone) : customer.phone,
    }))

    // Use pagination utility
    return NextResponse.json(createPaginatedResponse(decryptedCustomers, page, limit, count || 0))
  },
  {
    requireAuth: true,
    requireRole: 'staff', // Staff and above can view customers
    rateLimitType: 'default',
  }
)

// POST /api/v1/customers - Create customer with security
export const POST = withSecurity(
  async (req, { user, validatedBody }) => {
    const supabase = await createClient()
    const customerData = validatedBody as z.infer<typeof createCustomerSchema>

    // Encrypt sensitive data before storing
    const encryptedData = {
      ...customerData,
      email: customerData.email ? encryptEmail(customerData.email) : undefined,
      phone: customerData.phone ? encryptPhone(customerData.phone) : undefined,
    }

    // Insert customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([encryptedData])
      .select()
      .single()

    if (error) {
      log.error('Failed to create customer:', error)
      return NextResponse.json(
        { error: 'Failed to create customer', message: error.message },
        { status: 500 }
      )
    }

    // Audit log
    await auditCreate(
      'customer',
      customer.id,
      customer,
      user.profileId,
      undefined, // organizationId
      req
    )

    // Decrypt sensitive data for response
    const decryptedCustomer = {
      ...customer,
      email: customer.email ? decryptEmail(customer.email) : customer.email,
      phone: customer.phone ? decryptPhone(customer.phone) : customer.phone,
    }

    return NextResponse.json(decryptedCustomer, { status: 201 })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    validateBody: createCustomerSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
