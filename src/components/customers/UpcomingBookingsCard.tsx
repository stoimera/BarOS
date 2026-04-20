import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCustomerUpcomingBookings } from '@/hooks/useCustomerBookings'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClockIcon } from 'lucide-react'

interface UpcomingBookingsCardProps {
  showPastBookings?: boolean
}

export function UpcomingBookingsCard({ showPastBookings = false }: UpcomingBookingsCardProps) {
  const { data: bookings, isLoading, error } = useCustomerUpcomingBookings(showPastBookings)
  const [showAll, setShowAll] = useState(false)

  // Debug logging
  console.log('UpcomingBookingsCard render:', { bookings, isLoading, error })

  const formatTime = (time: string) => {
    if (!time) return ''
    try {
      const timeStr = time.toString()
      if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
      }
      return timeStr
    } catch (error) {
      console.error('Error formatting time:', error, time)
      return time || ''
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString)
        return 'Invalid date'
      }
      return format(date, 'MMM d, yyyy')
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-muted text-foreground">Confirmed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-muted text-foreground">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-sm text-foreground">✓</span>
      case 'pending':
        return <span className="text-sm text-primary">⏰</span>
      default:
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    console.log('UpcomingBookingsCard: Loading state')
    return (
      <Card className="bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.log('UpcomingBookingsCard: Error state:', error)
    return (
      <Card className="bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load bookings. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const upcomingBookings = bookings || []
  const displayBookings = showAll ? upcomingBookings : upcomingBookings.slice(0, 3)

  console.log('UpcomingBookingsCard: Render with bookings:', { upcomingBookings, displayBookings })

  return (
    <Card className="bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">
          {showPastBookings ? 'All Bookings' : 'Upcoming Bookings'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-4">
              <span className="text-2xl sm:text-3xl mx-auto mb-4 text-gray-400 dark:text-gray-500 block">🗓️</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {showPastBookings ? 'No bookings found' : 'No upcoming bookings'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.location.href = '/customer/bookings'}
            >
              Book Now
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayBookings.map((booking) => (
                <div key={booking.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(booking.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm dark:text-white truncate">
                        {formatDate(booking.booking_date)}
                      </h4>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">⏰</span>
                        <span>{formatTime(booking.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">👥</span>
                        <span>Party of {booking.party_size}</span>
                      </div>
                      {booking.notes && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">📍</span>
                          <span className="line-clamp-2">{booking.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {upcomingBookings.length > 3 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full"
                >
                  {showAll ? 'Show Less' : `Show All (${upcomingBookings.length})`}
                </Button>
              </div>
            )}
            
            {upcomingBookings.length > 0 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/customer/bookings'}
                  className="w-full"
                >
                  View All Bookings
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
