"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { api } from '@/lib/api/client'

interface BookingAnalyticsData {
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  cancelledBookings: number
  totalGuests: number
  averagePartySize: number
  bookingsByDay: Array<{ date: string; count: number }>
  topCustomers: Array<{ name: string; bookings: number }>
}

export function BookingAnalytics() {
  const [data, setData] = useState<BookingAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get<BookingAnalyticsData>('bookings/analytics')
      setData({
        ...response.data,
        topCustomers: Array.isArray(response.data.topCustomers) ? response.data.topCustomers : []
      })
    } catch (analyticsError) {
      console.error('Failed to load analytics:', analyticsError)
      setError("Failed to load analytics data")
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Booking Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mx-auto text-gray-300 mb-2 block">📊</span>
            <p>Failed to load analytics data</p>
            <Button variant="outline" onClick={loadAnalytics} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <span className="text-sm text-muted-foreground">🗓️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {data.confirmedBookings} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <span className="text-sm text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalGuests}</div>
            <p className="text-xs text-muted-foreground">
              Avg {data.averagePartySize} per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmation Rate</CardTitle>
            <span className="text-sm text-muted-foreground">✓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalBookings > 0 ? Math.round((data.confirmedBookings / data.totalBookings) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.pendingBookings} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <span className="text-sm text-muted-foreground">✗</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalBookings > 0 ? Math.round((data.cancelledBookings / data.totalBookings) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cancelledBookings} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      {Array.isArray(data.topCustomers) && data.topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{customer.bookings} bookings</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 