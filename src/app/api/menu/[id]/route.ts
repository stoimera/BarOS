import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.menu.[id]')

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  price: z.number().nonnegative().optional(),
  is_available: z.boolean().optional(),
  image_url: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  is_eighty_sixed: z.boolean().optional(),
  eighty_sixed_at: z.string().nullable().optional(),
})

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Menu API: Starting GET request for ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Menu API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Menu API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('menu_items').select('count').limit(1)

      if (testError) {
        log.error('Menu API: Database connection failed:', testError)
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
      }

      log.info('Menu API: Database connection successful, fetching menu item')

      // Fetch the specific menu item
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        log.error('Menu API: Failed to fetch menu item from database:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!menuItem) {
        log.error('Menu API: Menu item not found')
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
      }

      log.info('Menu API: Successfully fetched menu item from database')

      // Transform the data to match the expected format
      const transformedItem = {
        ...menuItem,
        created_at: new Date(menuItem.created_at),
        updated_at: new Date(menuItem.updated_at),
      }

      log.info('Menu API: Returning transformed menu item from database')
      return NextResponse.json(transformedItem)
    } catch (error) {
      log.error('Menu API: Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'menu_item',
  }
)

const menuItemUpdateSecurity = {
  requireAuth: true as const,
  requireRole: 'staff' as const,
  rateLimitType: 'strict' as const,
  validateBody: updateMenuItemSchema,
  auditAction: 'update' as const,
  auditResourceType: 'menu_item' as const,
}

async function handleMenuItemPatchPut(
  _req: NextRequest,
  { routeContext, validatedBody }: { routeContext?: unknown; validatedBody?: z.infer<typeof updateMenuItemSchema> }
) {
  try {
    const { params } = routeContext as { params: { id: string } }
    const { id } = params
    const data = validatedBody as z.infer<typeof updateMenuItemSchema>
    log.info('menu_item_update', { id })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log.error('Menu API: Missing required environment variables')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const supabase = await createClient()

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      log.error('Menu API: Failed to update menu item in database:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    const transformedItem = {
      ...menuItem,
      created_at: new Date(menuItem.created_at),
      updated_at: new Date(menuItem.updated_at),
    }

    return NextResponse.json(transformedItem)
  } catch (error) {
    log.error('Menu API: Error updating menu item:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const PUT = withSecurity(handleMenuItemPatchPut, menuItemUpdateSecurity)

/** Same behavior as PUT — partial menu item updates (e.g. 86 toggle). */
export const PATCH = withSecurity(handleMenuItemPatchPut, menuItemUpdateSecurity)

export const DELETE = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Menu API: DELETE request received for ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Menu API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Menu API: Attempting to delete menu item from database')
      const supabase = await createClient()

      const { error } = await supabase.from('menu_items').delete().eq('id', id)

      if (error) {
        log.error('Menu API: Failed to delete menu item from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Menu API: Menu item deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Menu API: Error deleting menu item:', error)
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
    auditResourceType: 'menu_item',
  }
)
