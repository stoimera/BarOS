"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { BookingWithCustomer } from "@/types/booking"

interface BookingCalendarProps {
  bookings: BookingWithCustomer[]
  onDateClick?: (date: Date) => void
  onBookingClick?: (booking: BookingWithCustomer) => void
}

export function BookingCalendar({ 
  bookings, 
  onDateClick, 
  onBookingClick 
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Helper functions for status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-muted text-foreground'
      case 'completed':
        return 'bg-muted text-foreground'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      booking.date ? isSameDay(new Date(booking.date), date) : false
    )
  }

  // Get total guests for a date
  const getTotalGuestsForDate = (date: Date) => {
    return getBookingsForDate(date).reduce((total, booking) => total + booking.party_size, 0)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const handleBookingClick = (booking: BookingWithCustomer, e: React.MouseEvent) => {
    e.stopPropagation()
    onBookingClick?.(booking)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(new Date())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Calendar View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              →
            </Button>
          </div>
        </div>
        <p className="text-lg font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {daysInMonth.map((day, index) => {
            const dayBookings = getBookingsForDate(day)
            const totalGuests = getTotalGuestsForDate(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentDay = isToday(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-gray-200 cursor-pointer transition-colors
                  ${isCurrentMonth ? "bg-background" : "bg-muted"}
                  ${isSelected ? "ring-2 ring-blue-500" : ""}
                  ${isCurrentDay ? "bg-muted" : ""}
                  hover:bg-muted
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentDay ? "text-primary" : "text-foreground"}
                    ${!isCurrentMonth ? "text-gray-400" : ""}
                  `}>
                    {format(day, "d")}
                  </span>
                  {dayBookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayBookings.length}
                    </Badge>
                  )}
                </div>

                {/* Bookings for this day */}
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer
                        ${getStatusColor(booking.status)}
                        hover:opacity-80
                      `}
                      onClick={(e) => handleBookingClick(booking, e)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">
                          {booking.customer.name}
                        </span>
                        <span className="text-xs">({booking.party_size})</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>

                {/* Total guests indicator */}
                {totalGuests > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground text-center">
                    {totalGuests} guests total
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted rounded"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 