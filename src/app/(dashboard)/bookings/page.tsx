"use client"

import { useState } from 'react'
import { useBookings } from '@/hooks/useBookings'
import { useWaitlist } from '@/hooks/useWaitlist'
import { BookingWithCustomer, CreateBookingData, UpdateBookingData, WaitlistEntry } from '@/types/booking'
import { EnhancedBookingFormModal } from '@/components/bookings/EnhancedBookingFormModal'
import { WaitlistManager } from '@/components/bookings/WaitlistManager'
import { DeleteBookingModal } from '@/components/bookings/DeleteBookingModal'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states'
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Edit,
  Trash2,
  Users,
  DollarSign,
  List,
  MoreHorizontal
} from 'lucide-react'
import { formatDateGB } from '@/utils/dateUtils'
import { endOfMonth, endOfWeek, isPast, isThisMonth, isThisWeek, isToday, isTomorrow, startOfMonth, startOfWeek } from 'date-fns'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/uiStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface BookingStats {
  total: number
  confirmed: number
  pending: number
  completed: number
  cancelled: number
  today: number
  thisWeek: number
  thisMonth: number
  total_guests: number
  average_party_size: number
}

export default function BookingsPage() {
  const DAILY_CAPACITY_LIMIT = 50
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [editingBooking, setEditingBooking] = useState<BookingWithCustomer | null>(null)
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<BookingWithCustomer | null>(null)
  const [activeTab, setActiveTab] = useState("bookings")
  const modalOpen = useUIStore(state => state.addBookingModalOpen)
  const openAddBookingModal = useUIStore(state => state.openAddBookingModal)
  const closeAddBookingModal = useUIStore(state => state.closeAddBookingModal)

  // Use React Query hook for bookings
  const {
    bookings,
    isLoading,
    error,
    createBooking,
    updateBooking,
    deleteBooking,
    isCreating,
    isUpdating,
    isDeleting
  } = useBookings({
    search: searchTerm,
    status: statusFilter !== "all" ? [statusFilter as 'pending' | 'confirmed' | 'cancelled' | 'completed'] : undefined,
    date_from: dateFilter === "today" ? new Date() : undefined,
    date_to: dateFilter === "today" ? new Date() : undefined,
    sortBy: "date",
    sortOrder: "desc"
  })

  // Use React Query hook for waitlist
  const {
    waitlist,
    addToWaitlist,
    updateWaitlistEntry,
    deleteWaitlistEntry,
  } = useWaitlist({
    status: "waiting"
  })

  // Calculate stats from bookings data
  const stats: BookingStats = {
    total: bookings.length,
    confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
    pending: bookings.filter((b: any) => b.status === 'pending').length,
    completed: bookings.filter((b: any) => b.status === 'completed').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
    today: bookings.filter((b: any) => {
      const bookingDate = new Date(b.booking_date || b.date);
      return isToday(bookingDate);
    }).length,
    thisWeek: bookings.filter((b: any) => {
      const bookingDate = new Date(b.booking_date || b.date)
      return isThisWeek(bookingDate, { weekStartsOn: 1 })
    }).length,
    thisMonth: bookings.filter((b: any) => {
      const bookingDate = new Date(b.booking_date || b.date)
      return isThisMonth(bookingDate)
    }).length,
    total_guests: bookings.reduce((sum: number, b: any) => sum + (b.party_size || 0), 0),
    average_party_size: bookings.length > 0 
      ? Math.round(bookings.reduce((sum: number, b: any) => sum + (b.party_size || 0), 0) / bookings.length)
      : 0
  }

  const openAddModal = () => {
    setEditingBooking(null)
    openAddBookingModal()
  }

  const openEditModal = (booking: BookingWithCustomer) => {
    setEditingBooking(booking)
    openAddBookingModal()
  }

  const closeModal = () => {
    setEditingBooking(null)
    closeAddBookingModal()
  }

  const handleSave = async (form: CreateBookingData | UpdateBookingData) => {
    try {
      if (editingBooking) {
        await updateBooking({ id: editingBooking.id, data: form as UpdateBookingData })
        // Check if booking was confirmed and show notification
        if ((form as UpdateBookingData).status === 'confirmed') {
          toast.success('Booking confirmed and customer notified')
        }
      } else {
        await createBooking(form as CreateBookingData)
      }
      closeModal()
    } catch (error) {
      // Error handling is done in the mutation
      throw error
    }
  }

  const handleWaitlist = async (data: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'>) => {
    try {
      await addToWaitlist(data)
      closeModal()
    } catch (error) {
      // Error handling is done in the mutation
      throw error
    }
  }

  const handleConvertWaitlistToBooking = async (waitlistId: string, bookingData: CreateBookingData) => {
    try {
      // Create the booking
      await createBooking(bookingData)
      
      // Update waitlist entry status to 'booked'
      await updateWaitlistEntry({ 
        id: waitlistId, 
        data: { 
          status: 'booked', 
          booked_at: new Date() 
        } 
      })
      
      toast.success('Waitlist entry converted to booking successfully')
    } catch {
      toast.error('Failed to convert waitlist entry to booking')
    }
  }

  const handleNotifyWaitlist = async (waitlistId: string) => {
    try {
      await updateWaitlistEntry({ 
        id: waitlistId, 
        data: { 
          status: 'notified', 
          notified_at: new Date() 
        } 
      })
      toast.success('Customer notified successfully')
    } catch {
      toast.error('Failed to notify customer')
    }
  }

  const handleRemoveWaitlist = async (waitlistId: string) => {
    try {
      await deleteWaitlistEntry(waitlistId)
      toast.success('Waitlist entry removed successfully')
    } catch {
      toast.error('Failed to remove waitlist entry')
    }
  }

  const handleQuickConfirm = async (bookingId: string) => {
    try {
      await updateBooking({ id: bookingId, data: { status: 'confirmed' } })
      // The confirmation email will be sent automatically by the API
      toast.success('Booking confirmed and customer notified')
    } catch {
      // Error handling is done in the mutation
    }
  }

  const handleDelete = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return
    setBookingToDelete(booking)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!bookingToDelete) return
    setDeletingBookingId(bookingToDelete.id)
    try {
      await deleteBooking(bookingToDelete.id)
      setDeleteModalOpen(false)
      setBookingToDelete(null)
    } catch {
      // Error handling is done in the mutation
    } finally {
      setDeletingBookingId(null)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setBookingToDelete(null)
  }

  const getDateBadge = (date: Date | string) => {
    const bookingDate = typeof date === 'string' ? new Date(date) : date
    
    if (isPast(bookingDate)) {
      return <Badge variant="secondary">Past</Badge>
    } else if (isToday(bookingDate)) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Today</Badge>
    } else if (isTomorrow(bookingDate)) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Tomorrow</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const formatBookingDateTime = (date: Date | string | undefined, time: string | undefined) => {
    if (!date || !time) {
      return 'No date/time'
    }
    const bookingDate = typeof date === 'string' ? new Date(date) : date
    if (isNaN(bookingDate.getTime())) {
      return 'Invalid date'
    }
    return `${formatDateGB(bookingDate)} at ${time}`
  }

  const isFullyBooked = bookings.filter((booking) => {
    const bookingDate = new Date(booking.booking_date || booking.date || new Date())
    if (dateFilter === 'today') {
      return isToday(bookingDate)
    }
    if (dateFilter === 'this_week') {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
      return bookingDate >= weekStart && bookingDate <= weekEnd
    }
    if (dateFilter === 'this_month') {
      const monthStart = startOfMonth(new Date())
      const monthEnd = endOfMonth(new Date())
      return bookingDate >= monthStart && bookingDate <= monthEnd
    }
    return isToday(bookingDate)
  }).length >= DAILY_CAPACITY_LIMIT

  // Helper functions for status styling and icons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3 mr-1" />
      case 'pending':
        return <Clock className="h-3 w-3 mr-1" />
      case 'completed':
        return <CheckCircle className="h-3 w-3 mr-1" />
      case 'cancelled':
        return <XCircle className="h-3 w-3 mr-1" />
      default:
        return <AlertTriangle className="h-3 w-3 mr-1" />
    }
  }

  if (isLoading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={8} />
        <DataTableSkeleton rows={10} columns={6} />
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage your urban bar bookings</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load bookings"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and waitlist</p>
        </div>
        <Button onClick={openAddModal} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Booking
        </Button>
      </div>

      {/* Stats - Mobile responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Confirmed</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Today</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Party</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.average_party_size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Waitlist</p>
                <p className="text-lg sm:text-2xl font-bold">{waitlist.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          {/* Filters - Mobile responsive */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table - Mobile responsive */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <TableSkeleton />
              ) : error ? (
                <div className="p-4">
                  <ErrorAlert 
                    title="Failed to load bookings"
                    message="An error occurred while loading bookings"
                    onRetry={() => window.location.reload()}
                  />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
                  <p className="text-gray-500">Create your first booking to get started.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Party Size</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{booking.customer?.name}</div>
                                {booking.customer?.email && (
                                  <div className="text-sm text-gray-500">{booking.customer.email}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatBookingDateTime(booking.booking_date || booking.date, booking.start_time || booking.time)}
                                </div>
                                {getDateBadge(booking.booking_date || booking.date || new Date())}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-500" />
                                {booking.party_size}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusIcon(booking.status)}
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditModal(booking)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                {booking.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickConfirm(booking.id)}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(booking.id)}
                                  disabled={deletingBookingId === booking.id || isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3 p-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="p-4">
                        <div className="space-y-3">
                          {/* Customer Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{booking.customer?.name}</h3>
                              {booking.customer?.email && (
                                <p className="text-sm text-gray-500">{booking.customer.email}</p>
                              )}
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="hidden sm:inline">{booking.status}</span>
                            </Badge>
                          </div>

                          {/* Date & Time */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">
                                {formatBookingDateTime(booking.booking_date || booking.date, booking.start_time || booking.time)}
                              </div>
                              {getDateBadge(booking.booking_date || booking.date || new Date())}
                            </div>
                          </div>

                          {/* Party Size */}
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>Party of {booking.party_size}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(booking)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {booking.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickConfirm(booking.id)}
                                disabled={isUpdating}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDelete(booking.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <WaitlistManager
            date={dateFilter === "today" ? new Date() : undefined}
            onConvertToBooking={handleConvertWaitlistToBooking}
            onNotify={handleNotifyWaitlist}
            onRemove={handleRemoveWaitlist}
          />
        </TabsContent>
      </Tabs>

      {/* Booking Form Modal */}
      <EnhancedBookingFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        onWaitlist={handleWaitlist}
        booking={editingBooking}
        loading={isCreating || isUpdating}
        isFullyBooked={isFullyBooked}
      />

      {/* Delete Booking Modal */}
      <DeleteBookingModal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        booking={bookingToDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
} 