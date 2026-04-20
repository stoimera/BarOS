"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, QrCode } from "lucide-react"
import { format, isToday, isTomorrow, isPast } from "date-fns"
import { EventWithDetails } from "@/types/event"
import { RSVPStatus } from "@/types/common"
import { RSVPList } from "@/components/events/RSVPList"
import { QRCodeModal } from "@/components/events/QRCodeModal"
import { EventDeleteDialog } from "@/components/events/EventDeleteDialog"
import { EventFormModal } from "@/components/events/EventFormModal"
import { ErrorAlert, StatsSkeleton } from "@/components/ui/loading-states"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import Image from "next/image"
import { api } from '@/lib/api/client'
import { useEvents } from '@/hooks/useEvents'

interface RSVPWithCustomer {
  id: string
  user_id: string
  event_id: string
  status: RSVPStatus
  checked_in: boolean
  created_at: Date
  updated_at: Date
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
    tags: string[]
    notes?: string
    created_at: Date
    updated_at: Date
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [rsvps, setRsvps] = useState<RSVPWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<'details' | 'rsvps'>('details')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  
  // Use the same mutations as the events list
  const { deleteEvent, updateEvent } = useEvents()

  const loadEventData = useCallback(async () => {
    if (!params.id) return
    
    try {
      setLoading(true)
      setError("")
      
      const [eventRes, rsvpRes] = await Promise.all([
        api.get<{ event: EventWithDetails }>(`/api/events/${params.id}`),
        api.get<{ rsvps: RSVPWithCustomer[] }>(`/api/events/${params.id}/rsvps`)
      ])
      
      setEvent(eventRes.data.event)
      setRsvps(rsvpRes.data.rsvps || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load event data"
      setError(errorMessage)
      toast.error("Failed to load event data", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadEventData()
  }, [params.id, loadEventData])

  const handleCheckIn = async (rsvpId: string, checkedIn: boolean) => {
    try {
      await api.put(`/api/rsvps/${rsvpId}/checkin`, { checkedIn })
      
      setRsvps(prev => prev.map(rsvp => 
        rsvp.id === rsvpId ? { ...rsvp, checked_in: checkedIn } : rsvp
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update check-in status"
      toast.error("Failed to update check-in status", { description: errorMessage })
      throw error
    }
  }

  const handleUpdateStatus = async (rsvpId: string, status: RSVPStatus) => {
    try {
      await api.put(`/api/rsvps/${rsvpId}/status`, { status })
      
      setRsvps(prev => prev.map(rsvp => 
        rsvp.id === rsvpId ? { ...rsvp, status } : rsvp
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update RSVP status"
      toast.error("Failed to update RSVP status", { description: errorMessage })
      throw error
    }
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleSaveEvent = async (eventData: any) => {
    if (!event) return
    
    try {
      // Transform form data to match API expectations
      const eventDate = eventData.date instanceof Date ? eventData.date : new Date(eventData.date)
      const transformedData = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventDate.toISOString().split('T')[0],
        start_time: eventDate.toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
        end_time: undefined, // We'll need to add end time handling if needed
        location: eventData.location,
        category: eventData.category,
        max_capacity: eventData.capacity,
        price: eventData.price,
        image_url: eventData.image_url
      }
      
      await updateEvent({ id: event.id, data: transformedData })
      await loadEventData() // Reload the event data
      setEditModalOpen(false)
      toast.success('Event updated successfully')
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!event) return
    
    try {
      await deleteEvent(event.id)
      router.push('/events')
    } catch (error) {
      // Error handling is already done in the mutation
      console.error('Delete error:', error)
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const getDateBadge = (date?: string | Date) => {
    if (!date) {
      return <Badge variant="secondary">No date</Badge>
    }
    const eventDate = new Date(date)
    
    if (isPast(eventDate)) {
      return <Badge variant="secondary">Past</Badge>
    } else if (isToday(eventDate)) {
      return <Badge variant="default">Today</Badge>
    } else if (isTomorrow(eventDate)) {
      return <Badge variant="default">Tomorrow</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const formatEventDate = (date?: string | Date) => {
    if (!date) {
      return 'No date set'
    }
    const eventDate = new Date(date)
    return format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")
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
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <StatsSkeleton />

        {/* Tabs Skeleton */}
        <div className="border-b border-border">
          <div className="flex space-x-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <ErrorAlert 
          title="Failed to load event"
          message={error || "Event not found"}
          onRetry={loadEventData}
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
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Event Details & RSVP Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQrModalOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{event.total_rsvps}</p><p className="text-sm text-muted-foreground">Total RSVPs</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{event.going_count}</p><p className="text-sm text-muted-foreground">Going</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{event.interested_count}</p><p className="text-sm text-muted-foreground">Interested</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{event.checked_in_count}</p><p className="text-sm text-muted-foreground">Checked In</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveTab('rsvps')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rsvps' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            Attendees ({rsvps.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">{formatEventDate(event.date)}</p>
              {getDateBadge(event.date)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm bg-muted p-3 rounded-md">{event.description}</p>
            </div>
            {event.image_url && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Event Image</p>
                <Image 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full max-w-md h-48 object-cover rounded-md"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <RSVPList
          eventId={event.id}
          rsvps={rsvps}
          onCheckIn={handleCheckIn}
          onUpdateStatus={handleUpdateStatus}
          loading={loading}
        />
      )}

      <QRCodeModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
      />

      {/* Event Delete Dialog */}
      <EventDeleteDialog
        event={event}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={false}
      />

      {/* Event Edit Modal */}
      <EventFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEvent}
        initialValues={event}
      />
    </div>
  )
} 