import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { startOfMonth, endOfMonth } from 'date-fns'
import { withSecurity } from '@/lib/security/api-middleware'

const log = createLogger('api.bookings.revenue')

export const GET = withSecurity(
  async () => {
    try {
      const supabase = await createClient()

      log.info('Bookings Revenue API: Starting GET request')

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('party_size, status, booking_date, created_at')

      if (error) {
        log.error('Bookings Revenue API: Error fetching bookings:', error)
        throw error
      }

      log.info('Bookings Revenue API: Bookings fetched:', bookings?.length || 0)

      if (!bookings || bookings.length === 0) {
        return NextResponse.json({
          total_revenue: 0,
          this_month_revenue: 0,
          average_per_booking: 0,
          total_bookings: 0,
          completed_revenue: 0,
          pending_revenue: 0,
        })
      }

      // Revenue calculation constants
      const AVERAGE_SPEND_PER_PERSON = 25 // €25 per person average

      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      // Calculate total revenue (from completed and confirmed bookings)
      const revenueBookings = bookings.filter(
        (b) => b.status === 'completed' || b.status === 'confirmed'
      )

      const totalRevenue = revenueBookings.reduce((sum, booking) => {
        return sum + (booking.party_size || 1) * AVERAGE_SPEND_PER_PERSON
      }, 0)

      // Calculate this month's revenue
      const thisMonthBookings = revenueBookings.filter((booking) => {
        const bookingDate = new Date(booking.booking_date)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      })

      const thisMonthRevenue = thisMonthBookings.reduce((sum, booking) => {
        return sum + (booking.party_size || 1) * AVERAGE_SPEND_PER_PERSON
      }, 0)

      // Calculate revenue by status
      const completedRevenue = bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, booking) => sum + (booking.party_size || 1) * AVERAGE_SPEND_PER_PERSON, 0)

      const pendingRevenue = bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'pending')
        .reduce((sum, booking) => sum + (booking.party_size || 1) * AVERAGE_SPEND_PER_PERSON, 0)

      // Calculate average per booking
      const averagePerBooking =
        revenueBookings.length > 0 ? totalRevenue / revenueBookings.length : 0

      const stats = {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        this_month_revenue: Math.round(thisMonthRevenue * 100) / 100,
        average_per_booking: Math.round(averagePerBooking * 100) / 100,
        total_bookings: revenueBookings.length,
        completed_revenue: Math.round(completedRevenue * 100) / 100,
        pending_revenue: Math.round(pendingRevenue * 100) / 100,
        calculation_basis: `€${AVERAGE_SPEND_PER_PERSON} per person`,
      }

      log.info('Bookings Revenue API: Revenue calculated:', stats)

      return NextResponse.json(stats)
    } catch (error) {
      log.error('Bookings Revenue API: Unexpected error:', error)

      // Return default stats structure to prevent dashboard errors
      return NextResponse.json({
        total_revenue: 0,
        this_month_revenue: 0,
        average_per_booking: 0,
        total_bookings: 0,
        completed_revenue: 0,
        pending_revenue: 0,
        error: 'Failed to calculate revenue',
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
