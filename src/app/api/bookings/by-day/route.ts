import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.by-day')

export const GET = withSecurity(
  async () => {
    try {
      const supabase = await createClient()

      log.info('Bookings By Day API: Starting GET request')

      const now = new Date()
      const thirtyDaysAgo = subDays(now, 30)

      const AVERAGE_SPEND_PER_PERSON = 25

      // Fetch all bookings from the last 30 days
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_date, created_at, status, party_size')
        .gte('booking_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .lte('booking_date', format(now, 'yyyy-MM-dd'))
        .order('booking_date', { ascending: true })

      if (error) {
        log.error('Bookings By Day API: Error fetching bookings:', error)
        throw error
      }

      log.info('Bookings By Day API: Bookings fetched:', bookings?.length || 0)

      // Create array of all days in the range
      const allDays = eachDayOfInterval({ start: thirtyDaysAgo, end: now })

      // Count bookings by day
      const bookingsByDay = allDays.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayBookings = bookings?.filter((booking) => booking.booking_date === dateStr) || []
        const revenueBookings = dayBookings.filter(
          (booking) => booking.status === 'confirmed' || booking.status === 'completed'
        )
        const revenue = revenueBookings.reduce(
          (sum, booking) => sum + (booking.party_size || 1) * AVERAGE_SPEND_PER_PERSON,
          0
        )

        return {
          date: format(date, 'MMM dd'), // Format for display (e.g., "Jan 15")
          fullDate: dateStr, // Keep full date for reference
          count: dayBookings.length,
          revenue: Math.round(revenue * 100) / 100,
          confirmed: dayBookings.filter((b) => b.status === 'confirmed').length,
          pending: dayBookings.filter((b) => b.status === 'pending').length,
          cancelled: dayBookings.filter((b) => b.status === 'cancelled').length,
          completed: dayBookings.filter((b) => b.status === 'completed').length,
        }
      })

      // If no real data or very little data, create some sample data for demonstration
      if (!bookings || bookings.length < 5) {
        log.info('Limited or no real booking data found, generating sample data')

        const sampleData = allDays.slice(-14).map((date) => {
          // Generate some realistic sample data with patterns
          const dayOfWeek = date.getDay()
          const isWeekend = [0, 6].includes(dayOfWeek)
          const isMonday = dayOfWeek === 1 // Typically slower

          let baseCount
          if (isWeekend) {
            baseCount = Math.floor(Math.random() * 6) + 5 // 5-10 bookings on weekends
          } else if (isMonday) {
            baseCount = Math.floor(Math.random() * 3) + 1 // 1-3 bookings on Mondays
          } else {
            baseCount = Math.floor(Math.random() * 5) + 2 // 2-6 bookings on other weekdays
          }

          // Add some randomness but keep it realistic
          const variation = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
          const count = Math.max(1, baseCount + variation)

          return {
            date: format(date, 'MMM dd'),
            fullDate: format(date, 'yyyy-MM-dd'),
            count,
            revenue: count * AVERAGE_SPEND_PER_PERSON * 2,
            confirmed: Math.floor(count * 0.75), // 75% confirmed
            pending: Math.floor(count * 0.15), // 15% pending
            cancelled: Math.floor(count * 0.1), // 10% cancelled
            completed: date < now ? Math.floor(count * 0.85) : 0, // 85% completed for past dates
          }
        })

        return NextResponse.json({
          bookingsByDay: sampleData,
          totalDays: sampleData.length,
          totalBookings: sampleData.reduce((sum, day) => sum + day.count, 0),
          isSampleData: true,
          note: 'Showing sample data for demonstration. Real data will appear when bookings are created.',
          dateRange: {
            start: format(subDays(now, 13), 'yyyy-MM-dd'),
            end: format(now, 'yyyy-MM-dd'),
          },
        })
      }

      const totalBookings = bookingsByDay.reduce((sum, day) => sum + day.count, 0)

      log.info('Bookings By Day API: Data processed successfully')

      return NextResponse.json({
        bookingsByDay,
        totalDays: bookingsByDay.length,
        totalBookings,
        isSampleData: false,
        dateRange: {
          start: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        },
      })
    } catch (error) {
      log.error('Bookings By Day API: Unexpected error:', error)

      // Return sample data as fallback
      const now = new Date()
      const sampleDays = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(now, 13 - i)
        const count = Math.floor(Math.random() * 6) + 1 // 1-6 bookings

        return {
          date: format(date, 'MMM dd'),
          fullDate: format(date, 'yyyy-MM-dd'),
          count,
          revenue: count * 50,
          confirmed: Math.floor(count * 0.8),
          pending: Math.floor(count * 0.2),
          cancelled: 0,
          completed: Math.floor(count * 0.5),
        }
      })

      return NextResponse.json({
        bookingsByDay: sampleDays,
        totalDays: sampleDays.length,
        totalBookings: sampleDays.reduce((sum, day) => sum + day.count, 0),
        isSampleData: true,
        error: 'Failed to fetch real data, showing sample data',
        dateRange: {
          start: format(subDays(now, 13), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        },
      })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)
