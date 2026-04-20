"use client"

import { useState } from 'react'
import { useEvents } from '@/hooks/useEvents'
import { EventWithDetails, CreateEventData, UpdateEventData } from '@/types/event'
import { EventFormModal } from '@/components/events/EventFormModal'
import { EventDeleteDialog } from '@/components/events/EventDeleteDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  EventCardSkeleton
} from '@/components/ui/loading-states'
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Euro,
  Edit,
  Trash2,
  Eye,
  Clock
} from 'lucide-react'
import { formatDateGB } from '@/utils/dateUtils'
import { endOfDay, endOfWeek, isPast, isThisWeek, isToday, isTomorrow, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/uiStore'
import { useUserRole } from '@/hooks/useUserRole'
import { useRouter } from 'next/navigation'

interface EventStats {
  total: number
  upcoming: number
  today: number
  this_week: number
  total_rsvps: number
  average_rsvps: number
}

export default function EventsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [editingEvent, setEditingEvent] = useState<EventWithDetails | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<EventWithDetails | null>(null)
  const modalOpen = useUIStore(state => state.addEventModalOpen)
  const openAddEventModal = useUIStore(state => state.openAddEventModal)
  const closeAddEventModal = useUIStore(state => state.closeAddEventModal)
  const { role } = useUserRole()

  const getDateRange = () => {
    if (dateFilter === 'today') {
      return { from: startOfDay(new Date()), to: endOfDay(new Date()) }
    }
    if (dateFilter === 'tomorrow') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { from: startOfDay(tomorrow), to: endOfDay(tomorrow) }
    }
    if (dateFilter === 'this_week') {
      return {
        from: startOfDay(new Date()),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }
    }
    return { from: undefined, to: undefined }
  }

  const dateRange = getDateRange()

  // Use React Query hook for events
  const {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    isDeleting
  } = useEvents({
    search: searchTerm,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    date_from: dateRange.from,
    date_to: dateRange.to,
    sortBy: "date",
    sortOrder: "desc"
  })

  // Calculate stats from events data
  const stats: EventStats = {
    total: events.length,
    upcoming: events.filter((e: any) => {
      const eventDate = e?.date || e?.event_date
      if (!eventDate) return false
      return !isPast(new Date(eventDate))
    }).length,
    today: events.filter((e: any) => {
      const eventDate = e?.date || e?.event_date
      if (!eventDate) return false
      return isToday(new Date(eventDate))
    }).length,
    this_week: events.filter((e: any) => {
      const eventDate = e?.date || e?.event_date
      if (!eventDate) return false
      return isThisWeek(new Date(eventDate), { weekStartsOn: 1 })
    }).length,
    total_rsvps: events.reduce((sum: number, e: any) => sum + (e?.current_rsvps || 0), 0),
    average_rsvps: events.length > 0 
      ? Math.round(events.reduce((sum: number, e: any) => sum + (e?.current_rsvps || 0), 0) / events.length)
      : 0
  }

  const openAddModal = () => {
    setEditingEvent(null)
    setIsEditMode(false)
    openAddEventModal()
  }

  const openEditModal = (event: EventWithDetails | undefined) => {
    console.log('Opening edit modal with event:', event)
    if (!event || !event?.id) {
      console.error('Invalid event passed to openEditModal:', event)
      toast.error('Cannot edit event: Invalid event data')
      return
    }
    
    // Set the editing event and edit mode, then open modal
    setEditingEvent(event)
    setIsEditMode(true)
    openAddEventModal()
  }

  const closeModal = () => {
    setEditingEvent(null)
    setIsEditMode(false)
    closeAddEventModal()
  }

  const handleSaveEvent = async (form: CreateEventData | UpdateEventData) => {
    try {
      console.log('handleSaveEvent called with form:', form)
      console.log('editingEvent:', editingEvent)
      console.log('isEditMode:', isEditMode)
      
      if (isEditMode && editingEvent?.id) {
        console.log('Updating event with ID:', editingEvent.id)
        await updateEvent({ id: editingEvent.id, data: form as UpdateEventData })
      } else {
        console.log('Creating new event')
        await createEvent(form as CreateEventData)
      }
      closeModal()
    } catch (error) {
      console.error('Error in handleSaveEvent:', error)
      // Error handling is done in the mutation
      throw error
    }
  }

  const handleDelete = (event: EventWithDetails | undefined) => {
    if (!event) return
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!eventToDelete?.id) return
    
    setDeletingEventId(eventToDelete.id)
    try {
      await deleteEvent(eventToDelete.id)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    } catch (error) {
      // Error handling is already done in the mutation
      console.error('Delete error:', error)
    } finally {
      setDeletingEventId(null)
    }
  }

  const getDateBadge = (date: Date | string | undefined) => {
    if (!date) return null
    const eventDate = typeof date === 'string' ? new Date(date) : date
    
    if (!eventDate || isNaN(eventDate.getTime())) {
      return <Badge variant="secondary">Invalid Date</Badge>
    }
    
    if (isPast(eventDate)) {
      return <Badge variant="secondary">Past</Badge>
    } else if (isToday(eventDate)) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Today</Badge>
    } else if (isTomorrow(eventDate)) {
      return <Badge variant="default" className="bg-muted text-foreground">Tomorrow</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const formatEventDateTime = (date: Date | string | undefined, startTime: string | undefined, endTime: string | undefined) => {
    if (!date || !startTime) {
      return 'No date/time'
    }
    const eventDate = typeof date === 'string' ? new Date(date) : date
    if (!eventDate || isNaN(eventDate.getTime())) {
      return 'Invalid date'
    }
    const timeString = endTime ? `${startTime} - ${endTime}` : startTime
    return `${formatDateGB(eventDate)} at ${timeString}`
  }

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={6} />
        <EventCardSkeleton count={6} />
        <Card>
          <CardContent className="p-4">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Events</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your restaurant events</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load events"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your restaurant events and promotions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={openAddModal} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">New Event</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcoming} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              events today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RSVPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total_rsvps}</div>
            <p className="text-xs text-muted-foreground">
              avg {stats.average_rsvps} per event
            </p>
          </CardContent>
        </Card>

                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Revenue</CardTitle>
             <Euro className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-lg sm:text-xl lg:text-2xl font-bold">€0</div>
             <p className="text-xs text-muted-foreground">
               from events
             </p>
           </CardContent>
         </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="live_music">Live Music</SelectItem>
                  <SelectItem value="food_tasting">Food Tasting</SelectItem>
                  <SelectItem value="wine_tasting">Wine Tasting</SelectItem>
                  <SelectItem value="special_occasion">Special Occasion</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first event.</p>
              <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Event Info - Full width on mobile, left side on desktop */}
                    <div className="flex-1 space-y-3">
                      {/* Title and Description */}
                      <div>
                        <h3 className="font-medium text-base sm:text-lg">{event?.title || 'Untitled Event'}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{event?.description || 'No description'}</p>
                      </div>
                      
                      {/* Date, Time, and Location - Stack vertically on mobile */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium">{formatEventDateTime(event?.date, event?.start_time, event?.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span>{event?.location || 'No location'}</span>
                        </div>
                      </div>
                      
                      {/* RSVP and Capacity - Stack vertically on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span className="font-medium">{event?.current_rsvps || 0}</span>
                            <span className="text-muted-foreground ml-1">RSVPs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-gray-300 rounded-full flex-shrink-0"></div>
                          <div>
                            <span className="text-muted-foreground">Capacity: </span>
                            <span className="font-medium">{event?.max_capacity || 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge and Actions - Right side on desktop, bottom on mobile */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {event?.date && getDateBadge(event.date)}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/events/${event?.id}`)}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            console.log('Edit button clicked for event:', event)
                            openEditModal(event)
                          }}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        {role === 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(event)}
                            disabled={deletingEventId === event?.id}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Form Modal */}
      <EventFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSaveEvent}
        initialValues={editingEvent}
        isEditMode={isEditMode}
      />

      {/* Event Delete Dialog */}
      <EventDeleteDialog
        event={eventToDelete}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setEventToDelete(null)
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
} 