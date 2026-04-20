"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStaff } from "@/hooks/useStaff"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  ErrorAlert, 
  PageHeaderSkeleton,
  StatCardSkeleton,
  DataTableSkeleton
} from "@/components/ui/loading-states"
import { 
  Plus, 
  Edit as EditIcon, 
  Trash2, 
  Eye as EyeIcon, 
  Clock as ClockIcon, 
  Crown,
  Users,
  Shield,
  Search
} from "lucide-react"
import { InviteStaffModal } from "@/components/staff/InviteStaffModal"
import { InvitationCodesList } from "@/components/staff/InvitationCodesList"
import { toast } from "sonner"
import { format } from "date-fns"

export default function StaffPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Use React Query hook for staff
  const {
    staff,
    currentUser,
    isLoading,
    error,
    deleteStaff,
    isDeleting
  } = useStaff({
    search: searchTerm
  })

  const handleInviteCreated = () => {
    toast.success("Invitation code generated successfully!")
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge className="bg-purple-100 text-purple-800">
        <Crown className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <Users className="h-3 w-3 mr-1" />
        Staff
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) {
      return
    }

    try {
      await deleteStaff(staffId)
      toast.success("Staff member removed successfully")
    } catch {
      toast.error("Failed to remove staff member")
    }
  }

  if (isLoading && staff.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={4} />
        <Card className="">
          <CardContent className="p-4">
            <DataTableSkeleton rows={8} columns={5} />
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
            <h1 className="text-2xl sm:text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load staff"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  const stats = {
    total: staff.length,
    admins: staff.filter(s => s.role === 'admin').length,
    staff: staff.filter(s => s.role === 'staff').length,
    active: staff.filter(s => s.is_active).length
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Staff Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your team members and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowInviteModal(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-sm sm:text-base">
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Invite Staff</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                      <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                team members
              </p>
            </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                      <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground">
                administrators
              </p>
            </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                      <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.staff}</div>
              <p className="text-xs text-muted-foreground">
                team members
              </p>
            </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
                      <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                active members
              </p>
            </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card className="">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No staff members found</h3>
              <p className="text-muted-foreground mb-4">Get started by inviting your first team member.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  {/* Desktop Grid View */}
                  <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
                    <div className="col-span-1">
                      <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      {getRoleBadge(member.role)}
                      <p className="text-muted-foreground">Joined {formatDate(member.created_at)}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      <p className="font-medium">{member.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
                      <p className="text-muted-foreground">{member.is_active ? 'active' : 'inactive'}</p>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/staff/${member.id}`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/staff/${member.id}?edit=true`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      {currentUser?.role === 'admin' && member.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStaff(member.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-base sm:text-lg">{member.first_name} {member.last_name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">{member.email}</p>
                      </div>
                      <div className="ml-3">
                        {getRoleBadge(member.role)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Joined {formatDate(member.created_at)}</span>
                        <span className="text-muted-foreground">{member.is_active ? 'active' : 'inactive'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
                    </div>
                    
                    <div className="flex items-center justify-end gap-1 sm:gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/staff/${member.id}`)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/staff/${member.id}?edit=true`)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <EditIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      {currentUser?.role === 'admin' && member.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStaff(member.id)}
                          disabled={isDeleting}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Codes */}
      <Card className="">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Invitation Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <InvitationCodesList />
        </CardContent>
      </Card>

      {/* Invite Staff Modal */}
      <InviteStaffModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteCreated}
      />
    </div>
  )
} 