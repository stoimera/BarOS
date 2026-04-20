import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.inventory.[id]')

const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  unit: z.string().optional(),
  current_stock: z.number().nonnegative().optional(),
  minimum_stock: z.number().nonnegative().optional(),
  cost_per_unit: z.number().nonnegative().optional(),
  supplier: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params
      log.info('Inventory API: Starting GET request for ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Inventory API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Inventory API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('inventory').select('count').limit(1)

      if (testError) {
        log.error('Inventory API: Database connection failed:', testError)
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

      log.info('Inventory API: Database connection successful, fetching inventory item')

      // Fetch the specific inventory item
      const { data: inventoryItem, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        log.error('Inventory API: Failed to fetch inventory item from database:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!inventoryItem) {
        log.error('Inventory API: Inventory item not found')
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
      }

      log.info('Inventory API: Successfully fetched inventory item from database')

      // Transform the data to match the expected format
      const transformedItem = {
        ...inventoryItem,
        created_at: new Date(inventoryItem.created_at),
        updated_at: new Date(inventoryItem.updated_at),
      }

      log.info('Inventory API: Returning transformed inventory item from database')
      return NextResponse.json(transformedItem)
    } catch (error) {
      log.error('Inventory API: Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

export const PUT = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params
      const data = validatedBody as z.infer<typeof updateInventorySchema>
      log.info('inventory_put', { id })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Inventory API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Inventory API: Attempting to update inventory item in database')
      const supabase = await createClient()

      // First, check if the item exists
      const { data: existingItem, error: checkError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single()

      if (checkError) {
        log.error('Inventory API: Failed to check if inventory item exists:', checkError)
        if (checkError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
        }
        return NextResponse.json({ error: checkError.message }, { status: 500 })
      }

      log.info('Inventory API: Found existing item:', existingItem)

      // Now attempt the update
      const { data: inventoryItem, error } = await supabase
        .from('inventory')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        log.error('Inventory API: Failed to update inventory item in database:', error)
        log.error('Inventory API: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!inventoryItem) {
        log.error('Inventory API: Inventory item not found')
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
      }

      log.info('Inventory API: Inventory item updated successfully in database:', inventoryItem)

      // Transform the data to match the expected format
      const transformedItem = {
        ...inventoryItem,
        created_at: new Date(inventoryItem.created_at),
        updated_at: new Date(inventoryItem.updated_at),
      }

      return NextResponse.json(transformedItem)
    } catch (error) {
      log.error('Inventory API: Error updating inventory item:', error)
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
    validateBody: updateInventorySchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)

export const DELETE = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      const { id } = await params
      log.info('Inventory API: DELETE request received for ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Inventory API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Inventory API: Attempting to delete inventory item from database')
      const supabase = await createClient()

      const { error } = await supabase.from('inventory').delete().eq('id', id)

      if (error) {
        log.error('Inventory API: Failed to delete inventory item from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Inventory API: Inventory item deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Inventory API: Error deleting inventory item:', error)
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
    auditResourceType: 'inventory',
  }
)
