"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Trash2, Calendar, Users, User, Mail, Phone, RefreshCw } from "lucide-react"
import { isToday, isTomorrow, isPast } from "date-fns"
import { BookingWithCustomer } from "@/types/booking"
import { ErrorAlert } from "@/components/ui/loading-states"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { formatDateGB, formatDateTimeGB } from '@/utils/dateUtils'
import { api } from '@/lib/api/client'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingWithCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string>("")

  const loadBooking = useCallback(async () => {
    if (!params.id) return
    
    try {
      setLoading(true)
      setError("")
      const response = await api.get<BookingWithCustomer>(`/api/bookings/${params.id}`)
      setBooking(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load booking"
      setError(errorMessage)
      toast.error("Failed to load booking", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadBooking()
  }, [params.id, loadBooking])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return

    setUpdating(true)
    try {
      const updatedBooking = await api.put<BookingWithCustomer>(`/api/bookings/${booking.id}`, { status: newStatus })
      setBooking(updatedBooking.data)
      toast.success("Booking status updated successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update booking status"
      toast.error("Failed to update booking status", { description: errorMessage })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!booking || !confirm(`Are you sure you want to delete this booking for ${booking.customer.name}?`)) return
    
    try {
      await api.delete(`/api/bookings/${booking.id}`)
      toast.success("Booking deleted successfully")
      router.push('/bookings')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete booking"
      toast.error("Failed to delete booking", { description: errorMessage })
    }
  }

  const getDateBadge = (date?: string | Date) => {
    if (!date) {
      return <Badge variant="secondary">No date</Badge>
    }
    const bookingDate = new Date(date)
    
    if (isPast(bookingDate)) {
      return <Badge variant="secondary">Past</Badge>
    } else if (isToday(bookingDate)) {
      return <Badge variant="default">Today</Badge>
    } else if (isTomorrow(bookingDate)) {
      return <Badge variant="default">Tomorrow</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      confirmed: 'bg-muted text-foreground',
      pending: 'bg-muted text-foreground',
      cancelled: 'bg-destructive/10 text-destructive',
      completed: 'bg-muted text-foreground'
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      confirmed: '✓',
      pending: '⏳',
      cancelled: '✗',
      completed: '✓'
    }
    return icons[status] || '?'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-44" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <ErrorAlert 
          title="Failed to load booking"
          message={error || "Booking not found"}
          onRetry={loadBooking}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">Reservation for {booking.customer.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/bookings/${booking.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{booking.date ? formatDateGB(booking.date) : 'No date set'}</p>
                  {getDateBadge(booking.date)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Party Size</p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{booking.party_size} guests</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusIcon(booking.status)} {booking.status}
                  </Badge>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{booking.customer.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {booking.customer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{booking.customer.email}</span>
                    </div>
                  </div>
                )}
                {booking.customer.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{booking.customer.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {booking.customer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{booking.customer.notes}</p>
                </div>
              )}

              {booking.customer.tags && booking.customer.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {booking.customer.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={booking.status}
                onValueChange={handleStatusUpdate}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="confirmed">✅ Confirmed</SelectItem>
                  <SelectItem value="completed">🎉 Completed</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {updating && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-mono text-sm">{booking.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDateTimeGB(new Date(booking.created_at))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDateTimeGB(new Date(booking.updated_at))}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 