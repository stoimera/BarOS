"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVisits } from '@/hooks/useVisits'
import { VisitWithDetails, VisitType } from '@/types/visit'
import { VisitCheckInModal } from '@/components/visits/VisitCheckInModal'
import { VisitDeleteDialog } from '@/components/visits/VisitDeleteDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states'
import { 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  Plus,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function VisitsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [visitTypeFilter, setVisitTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [visitToDelete, setVisitToDelete] = useState<VisitWithDetails | null>(null)

  // Use React Query hook for visits
  const {
    visits,
    totalCount,
    visitStats,
    isLoading,
    statsLoading,
    error,
    createVisit: _createVisit,
    updateVisit: _updateVisit,
    deleteVisit,
    isCreating: _isCreating,
    isUpdating: _isUpdating,
    isDeleting
  } = useVisits({
    search: searchTerm,
    visit_type: visitTypeFilter !== "all" ? visitTypeFilter as VisitType : undefined,
    date_from: dateFilter === "today" ? new Date() : undefined,
    date_to: dateFilter === "today" ? new Date() : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: 10
  })

  void _createVisit
  void _updateVisit
  void _isCreating
  void _isUpdating

  const handleCheckInSuccess = () => {
    toast.success("Customer checked in successfully!")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1) // Reset to first page when searching
  }

  const handleDeleteVisit = (visit: VisitWithDetails) => {
    setVisitToDelete(visit)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setVisitToDelete(null)
  }

  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return

    try {
      await deleteVisit(visitToDelete.id)
      toast.success("Visit deleted successfully")
    } catch (error) {
      console.error('Error deleting visit:', error)
      toast.error("Failed to delete visit")
    }
  }

  const getStatusBadge = (visit: VisitWithDetails) => {
    if (visit.check_in_time) {
      return <Badge className="bg-green-100 text-green-800">Checked In</Badge>
    }
    return <Badge variant="outline">Pending</Badge>
  }

  if (isLoading && visits.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={6} />
        <DataTableSkeleton rows={10} columns={6} />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Visit Tracking</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track customer visits and check-ins</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load visits"
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Visit Tracking</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track customer visits and manage check-ins</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowCheckInModal(true)} disabled={!user?.id} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Check In Customer</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
            ) : (
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{visitStats?.totalVisits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
            ) : (
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{visitStats?.todayVisits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              visits today
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
            ) : (
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{visitStats?.thisWeekVisits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              visits this week
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
            ) : (
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{visitStats?.thisMonthVisits || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              visits this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search visits..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Visit Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits List */}
      <Card className="">
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No visits found</h3>
              <p className="text-muted-foreground mb-4">Get started by checking in your first customer.</p>
              <Button onClick={() => setShowCheckInModal(true)} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Check In Customer
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div key={visit.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 border rounded-lg">
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                      <h3 className="font-medium text-base sm:text-lg">{visit.customer?.name}</h3>
                      <p className="text-sm text-muted-foreground break-all mt-1">{visit.customer?.email}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      <p className="font-medium">{format(new Date(visit.visit_date), 'MMM d, yyyy')}</p>
                      <p className="text-muted-foreground capitalize">{visit.visit_type}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      {getStatusBadge(visit)}
                      {visit.check_in_time && (
                        <p className="text-muted-foreground mt-1">
                          Checked in at {format(new Date(visit.check_in_time), 'HH:mm')}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/visits/${visit.id}`)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/visits/${visit.id}?edit=true`)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVisit(visit)}
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} visits
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="text-xs sm:text-sm"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0 text-xs sm:text-sm"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totalCount / 10)}
                    className="text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visit Check-In Modal */}
      <VisitCheckInModal
        open={showCheckInModal}
        onOpenChange={setShowCheckInModal}
        staffId={user?.id || ''}
        onSuccess={handleCheckInSuccess}
      />

      {/* Visit Delete Dialog */}
      <VisitDeleteDialog
        visit={visitToDelete}
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteVisit}
        isDeleting={isDeleting}
      />
    </div>
  )
} 