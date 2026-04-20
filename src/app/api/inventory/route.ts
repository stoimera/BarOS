import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.inventory')

const createInventorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  unit: z.string().min(1),
  current_stock: z.number().nonnegative(),
  minimum_stock: z.number().nonnegative(),
  cost_per_unit: z.number().nonnegative().optional(),
  supplier: z.string().optional().nullable(),
})

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const category = searchParams.get('category') || ''

      log.info('Inventory API: Starting GET request')

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Inventory API: Missing required environment variables')
        return NextResponse.json({ data: [], count: 0 })
      }

      // Always try to use real database first
      log.info('Inventory API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('inventory').select('count').limit(1)

      if (testError) {
        log.error('Inventory API: Database connection failed:', testError)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Inventory API: Database connection successful, fetching inventory')

      // Build query
      let query = supabase.from('inventory').select('*', { count: 'exact' })

      // Add search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Add category filter if provided
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      // Add pagination and alphabetical ordering
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('name', { ascending: true })

      const { data: inventory, error, count } = await query

      if (error) {
        log.error('Inventory API: Failed to fetch inventory from database:', error)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info(
        `Inventory API: Successfully fetched ${inventory?.length || 0} inventory items from database`
      )

      // Transform the data to match the expected format
      const transformedInventory =
        inventory?.map((item: Record<string, unknown>) => ({
          ...item,
          created_at: new Date(String(item.created_at)),
          updated_at: new Date(String(item.updated_at)),
        })) || []

      log.info('Inventory API: Returning transformed inventory from database')
      return NextResponse.json({
        data: transformedInventory,
        count: count || 0,
      })
    } catch (error) {
      log.error('Inventory API: Unexpected error:', error)
      return NextResponse.json({ data: [], count: 0 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createInventorySchema>
      log.info('Inventory API: POST request received:', data)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Inventory API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Inventory API: Attempting to create inventory item in database')
      const supabase = await createClient()

      const { data: inventoryItem, error } = await supabase
        .from('inventory')
        .insert([data])
        .select()
        .single()

      if (error) {
        log.error('Inventory API: Failed to create inventory item in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Inventory API: Inventory item created successfully in database:', inventoryItem)
      return NextResponse.json(inventoryItem)
    } catch (error) {
      log.error('Inventory API: Error creating inventory item:', error)
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
    validateBody: createInventorySchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
