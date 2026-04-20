"use client"

import { useState } from "react"
import { useSchedule } from "@/hooks/useSchedule"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search as SearchIcon, 
  Clock as ClockIcon, 
  AlertTriangle,
  Calendar,
  Users
} from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval as eachDayOfMonth } from "date-fns"
import { 
  ShiftWithStaff, 
  CreateShiftData, 
  UpdateShiftData, 
  SHIFT_TYPE_DISPLAY_NAMES
} from "@/types/schedule"
import { ShiftFormModal } from "@/components/schedule/ShiftFormModal"
import { ShiftDeleteModal } from "@/components/schedule/ShiftDeleteModal"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function SchedulePage() {
  const { user } = useAuth()
  
  // UI State
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all")
  const [selectedShiftTypeFilter, setSelectedShiftTypeFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftWithStaff | null>(null)
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<ShiftWithStaff | null>(null)

  // Use React Query hook for schedule
  const {
    staffMembers,
    shifts,
    isLoading,
    error,
    createShift,
    updateShift,
    deleteShift,
    isCreating: _isCreating,
    isUpdating: _isUpdating,
    isDeleting: _isDeleting
  } = useSchedule({
    staff_id: selectedStaffFilter !== "all" ? selectedStaffFilter : undefined,
    shift_type: selectedShiftTypeFilter !== "all" ? selectedShiftTypeFilter : undefined,
    date_from: startOfWeek(currentWeek),
    date_to: endOfWeek(currentWeek)
  })

  const handleCreateShift = async (data: CreateShiftData | UpdateShiftData) => {
    
    // Check authentication first
    if (!user) {
      toast.error("Authentication required", { description: "Please log in to create shifts" });
      return;
    }
    
    try {
      await createShift(data as CreateShiftData)
      closeModal()
      toast.success("Shift created successfully")
    } catch (error: any) {
      toast.error("Failed to create shift", { description: error?.message || 'Unknown error occurred' });
    }
  }

  const handleUpdateShift = async (data: CreateShiftData | UpdateShiftData) => {
    if (!editingShift) return
    
    try {
      await updateShift({ id: editingShift.id, data: data as UpdateShiftData })
      closeModal()
      toast.success("Shift updated successfully")
    } catch (error) {
      toast.error("Failed to update shift")
      throw error
    }
  }

  const handleDeleteShift = async (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (!shift) return
    
    setShiftToDelete(shift)
    setDeleteModalOpen(true)
  }

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return
    
    setDeletingShiftId(shiftToDelete.id)
    try {
      await deleteShift(shiftToDelete.id)
      toast.success("Shift deleted successfully")
      setDeleteModalOpen(false)
      setShiftToDelete(null)
    } catch (error: any) {
      toast.error("Failed to delete shift", { 
        description: error?.message || 'Unknown error occurred' 
      })
      throw error // Re-throw so the modal can handle it
    } finally {
      setDeletingShiftId(null)
    }
  }

  const openEditModal = (shift: ShiftWithStaff) => {
    setEditingShift(shift)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingShift(null)
    setDeleteModalOpen(false)
    setShiftToDelete(null)
  }

  void _isCreating
  void _isUpdating
  void _isDeleting

  if (isLoading && shifts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={4} />
        <CardGridSkeleton count={4} columns={4} />
        <Card className="">
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
            <h1 className="text-2xl sm:text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">Manage staff schedules and shifts</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load schedule"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  const stats = {
    total: shifts.length,
    thisWeek: shifts.filter(s => {
      const shiftDate = new Date(s.shift_date)
      return shiftDate >= startOfWeek(currentWeek) && shiftDate <= endOfWeek(currentWeek)
    }).length,
    staff: staffMembers.length,
    active: shifts.filter(s => s.is_active).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Schedule</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage staff schedules and shifts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              all time
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              shifts scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.staff}</div>
            <p className="text-xs text-muted-foreground">
              team members
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              active shifts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shifts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <Select value={selectedStaffFilter} onValueChange={setSelectedStaffFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Staff Member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedShiftTypeFilter} onValueChange={setSelectedShiftTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Shift Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(SHIFT_TYPE_DISPLAY_NAMES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Views */}
      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="week" className="space-y-4">
          <WeeklyCalendar
            shifts={shifts}
            staffMembers={staffMembers}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            openEditModal={user?.role === 'admin' ? openEditModal : undefined}
            handleDeleteShift={user?.role === 'admin' ? handleDeleteShift : undefined}
            deletingShiftId={deletingShiftId}
            isAdmin={user?.role === 'admin'}
          />
        </TabsContent>
        
        <TabsContent value="month" className="space-y-4">
          <MonthlyCalendar
            shifts={shifts}
            staffMembers={staffMembers}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            openEditModal={user?.role === 'admin' ? openEditModal : undefined}
            handleDeleteShift={user?.role === 'admin' ? handleDeleteShift : undefined}
            deletingShiftId={deletingShiftId}
            isAdmin={user?.role === 'admin'}
          />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <ShiftsList
            shifts={shifts}
            staffMembers={staffMembers}
            openEditModal={openEditModal}
            handleDeleteShift={handleDeleteShift}
            deletingShiftId={deletingShiftId}
            isAdmin={user?.role === 'admin'}
          />
        </TabsContent>
      </Tabs>

      {/* Shift Form Modal */}
      <ShiftFormModal
        open={modalOpen}
        onOpenChange={closeModal}
        onSubmit={editingShift ? handleUpdateShift : handleCreateShift}
        shift={editingShift}
        staffMembers={staffMembers}
      />

      {/* Shift Delete Modal */}
      <ShiftDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDeleteShift}
        shift={shiftToDelete}
        isDeleting={deletingShiftId === shiftToDelete?.id}
      />
    </div>
  )
}

// Weekly Calendar Component
function WeeklyCalendar({
  shifts,
  currentWeek,
  setCurrentWeek,
  openEditModal,
}: {
  shifts: ShiftWithStaff[]
  staffMembers: any[]
  currentWeek: Date
  setCurrentWeek: (date: Date) => void
  openEditModal?: (shift: ShiftWithStaff) => void
  handleDeleteShift?: (shiftId: string) => void
  deletingShiftId: string | null
  isAdmin?: boolean
}) {
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek)
  })

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.shift_date), date))
  }

  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Schedule</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDay(day)
            return (
              <div key={day.toISOString()} className="min-h-[120px] border rounded-lg p-2">
                <div className="text-sm font-medium text-center mb-2">
                  {format(day, 'EEE')}
                </div>
                <div className="text-xs text-muted-foreground text-center mb-2">
                  {format(day, 'MMM d')}
                </div>
                <div className="space-y-1">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`text-xs p-1 bg-muted rounded ${openEditModal ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                      onClick={() => openEditModal && openEditModal(shift)}
                    >
                      <div className="font-medium">{shift.staff?.first_name}</div>
                      <div className="text-muted-foreground">{shift.start_time} - {shift.end_time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Monthly Calendar Component
function MonthlyCalendar({
  shifts,
  currentMonth,
  setCurrentMonth,
  openEditModal,
}: {
  shifts: ShiftWithStaff[]
  staffMembers: any[]
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
  openEditModal?: (shift: ShiftWithStaff) => void
  handleDeleteShift?: (shiftId: string) => void
  deletingShiftId: string | null
  isAdmin?: boolean
}) {
  const monthDays = eachDayOfMonth({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.shift_date), date))
  }

  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subWeeks(currentMonth, 4))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addWeeks(currentMonth, 4))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium p-2">
              {day}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayShifts = getShiftsForDay(day)
            return (
              <div key={day.toISOString()} className="min-h-[80px] border rounded p-1">
                <div className="text-xs text-center mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <div
                      key={shift.id}
                      className={`text-xs p-1 bg-muted rounded ${openEditModal ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                      onClick={() => openEditModal && openEditModal(shift)}
                    >
                      <div className="font-medium truncate">{shift.staff?.first_name}</div>
                      <div className="text-muted-foreground truncate">{shift.start_time}</div>
                    </div>
                  ))}
                  {dayShifts.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayShifts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Shifts List Component
function ShiftsList({
  shifts,
  openEditModal,
  handleDeleteShift,
  deletingShiftId,
  isAdmin = false,
}: {
  shifts: ShiftWithStaff[]
  staffMembers: any[]
  openEditModal: (shift: ShiftWithStaff) => void
  handleDeleteShift: (shiftId: string) => void
  deletingShiftId: string | null
  isAdmin?: boolean
}) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>All Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No shifts found</h3>
            <p className="text-muted-foreground">Get started by creating your first shift.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="p-4 border rounded-lg bg-white shadow-sm">
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Staff and Date Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {shift.staff?.name || `${shift.staff?.first_name || ''} ${shift.staff?.last_name || ''}`.trim() || 'Unknown Staff'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(shift.shift_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      {/* Time and Role - Stack vertically on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2 sm:mt-0">
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            {shift.start_time} - {shift.end_time}
                          </p>
                          <p className="text-muted-foreground capitalize">
                            {shift.role || 'Staff'}
                          </p>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mt-2 sm:mt-0">
                          <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                            {shift.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes - Show below on mobile */}
                    {shift.notes && (
                      <div className="mt-2 sm:hidden">
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {shift.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Only show for admins */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(shift)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteShift(shift.id)}
                        disabled={deletingShiftId === shift.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Notes - Show on right side for larger screens */}
                {shift.notes && (
                  <div className="hidden sm:block mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {shift.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 