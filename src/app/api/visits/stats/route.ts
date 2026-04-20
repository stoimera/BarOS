import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.visits.stats')

export const GET = withSecurity(
  async () => {
    try {
      log.info('Visits Stats API: Starting GET request')

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Visits Stats API: Missing required environment variables')
        return NextResponse.json({
          totalVisits: 0,
          todayVisits: 0,
          thisWeekVisits: 0,
          thisMonthVisits: 0,
        })
      }

      const supabase = await createClient()

      // Get current date and calculate date ranges
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      log.info('Visits Stats API: Calculating stats for date ranges:', {
        today: today.toISOString(),
        thisWeek: thisWeek.toISOString(),
        thisMonth: thisMonth.toISOString(),
      })

      // Get total visits
      const { count: totalVisits, error: totalError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        log.error('Visits Stats API: Error getting total visits:', totalError)
        return NextResponse.json({
          totalVisits: 0,
          todayVisits: 0,
          thisWeekVisits: 0,
          thisMonthVisits: 0,
        })
      }

      // Get today's visits
      const { count: todayVisits, error: todayError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', today.toISOString())

      if (todayError) {
        log.error('Visits Stats API: Error getting today visits:', todayError)
      }

      // Get this week's visits
      const { count: thisWeekVisits, error: weekError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', thisWeek.toISOString())

      if (weekError) {
        log.error('Visits Stats API: Error getting this week visits:', weekError)
      }

      // Get this month's visits
      const { count: thisMonthVisits, error: monthError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', thisMonth.toISOString())

      if (monthError) {
        log.error('Visits Stats API: Error getting this month visits:', monthError)
      }

      const stats = {
        totalVisits: totalVisits || 0,
        todayVisits: todayVisits || 0,
        thisWeekVisits: thisWeekVisits || 0,
        thisMonthVisits: thisMonthVisits || 0,
      }

      log.info('Visits Stats API: Calculated stats:', stats)

      return NextResponse.json(stats)
    } catch (error) {
      log.error('Visits Stats API: Unexpected error:', error)
      return NextResponse.json({
        totalVisits: 0,
        todayVisits: 0,
        thisWeekVisits: 0,
        thisMonthVisits: 0,
      })
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
