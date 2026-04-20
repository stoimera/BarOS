import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.menu-items')

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  is_available: z.boolean().optional(),
  image_url: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
})

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const category = searchParams.get('category') || ''
      const available = searchParams.get('available') || ''
      const eightySixedOnly = searchParams.get('eighty_sixed_only') === '1'
      const limitParam = searchParams.get('limit')
      const limit = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam, 10) || 100)) : undefined

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Menu Items API: Missing required environment variables')
        return NextResponse.json({ data: [] })
      }

      // Always try to use real database first

      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('menu_items').select('count').limit(1)

      if (testError) {
        log.error('Menu Items API: Database connection failed:', testError)
        return NextResponse.json({ data: [] })
      }

      // Build query
      let query = supabase.from('menu_items').select('*').order('created_at', { ascending: false })
      if (limit !== undefined) {
        query = query.limit(limit)
      }

      // Add filters
      if (category) {
        query = query.eq('category', category)
      }

      if (available !== '') {
        query = query.eq('is_available', available === 'true')
      }

      if (eightySixedOnly) {
        query = query.eq('is_eighty_sixed', true)
      }

      const { data: menuItems, error } = await query

      if (error) {
        log.error('Menu Items API: Failed to fetch menu items from database:', error)
        return NextResponse.json({ data: [] })
      }

      // Transform the data to match the expected format
      const transformedItems =
        menuItems?.map((item: Record<string, unknown>) => ({
          ...item,
          created_at: new Date(String(item.created_at)),
          updated_at: new Date(String(item.updated_at)),
          // Convert tags from string to string[] if needed
          tags: Array.isArray(item.tags)
            ? item.tags
            : item.tags
              ? String(item.tags)
                  .split(',')
                  .map((tag: string) => tag.trim())
                  .filter(Boolean)
              : [],
        })) || []

      return NextResponse.json({
        data: transformedItems,
      })
    } catch (error) {
      log.error('Menu Items API: Unexpected error:', error)
      return NextResponse.json({ data: [] })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'menu_item',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createMenuItemSchema>

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Menu Items API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first

      const supabase = await createClient()

      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .insert([data])
        .select()
        .single()

      if (error) {
        log.error('Menu Items API: Failed to create menu item in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(menuItem)
    } catch (error) {
      log.error('Menu Items API: Error creating menu item:', error)
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
    validateBody: createMenuItemSchema,
    auditAction: 'create',
    auditResourceType: 'menu_item',
  }
)
