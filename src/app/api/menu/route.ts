import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getMenuItems } from '@/lib/menu'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.menu')

export const GET = withSecurity(
  async () => {
    try {
      log.info('API: Loading menu items...')
      const items = await getMenuItems({ available: true })
      log.info('API: Loaded menu items:', items)

      return NextResponse.json({
        success: true,
        items,
        count: items.length,
        drinks: items.filter((i) => i.category === 'Drinks').length,
        food: items.filter((i) => i.category === 'Food').length,
        shisha: items.filter((i) => i.category === 'Shisha').length,
      })
    } catch (error) {
      log.error('API: Error loading menu items:', error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
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
