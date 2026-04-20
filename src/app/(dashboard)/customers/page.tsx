"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomers } from '@/hooks/useCustomers'
import { Customer } from '@/types/customer'
import { CustomerFormModal } from '@/components/customers/CustomerFormModal'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import { CustomerBulkDeleteDialog } from '@/components/customers/CustomerBulkDeleteDialog'
import { VisitCheckInModal } from '@/components/visits/VisitCheckInModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateGB } from '@/utils/dateUtils'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/uiStore'
import { useUserRole } from '@/hooks/useUserRole'
import { useAuth } from '@/hooks/useAuth'
import { Plus } from 'lucide-react'

interface CustomerStats {
  total: number
  new_this_month: number
  active_this_month: number
  total_visits: number
  average_visits: number
}

export default function CustomersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const modalOpen = useUIStore(state => state.addCustomerModalOpen)
  const openAddCustomerModal = useUIStore(state => state.openAddCustomerModal)
  const closeAddCustomerModal = useUIStore(state => state.closeAddCustomerModal)
  const { role } = useUserRole()

  // Use React Query hook for customers
  const {
    customers,
    visits,
    totalCount,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    isBulkDeleting
  } = useCustomers({
    search: searchTerm,
    page,
    limit: 10
  })

  // Calculate stats from customers data
  const stats: CustomerStats = {
    total: totalCount,
    new_this_month: customers.filter((c: any) => {
      const createdDate = new Date(c.created_at)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    }).length,
    active_this_month: visits.filter((v: any) => {
      const visitDate = new Date(v.visit_date)
      const now = new Date()
      return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
    }).length,
    total_visits: visits.length,
    average_visits: customers.length > 0 ? Math.round(visits.length / customers.length) : 0
  }

  const openAddEditModal = (customer: Customer | null) => {
    setEditingCustomer(customer)
    openAddCustomerModal()
  }

  const closeModal = () => {
    setEditingCustomer(null)
    closeAddCustomerModal()
  }

  const handleSave = async (form: any) => {
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, data: form })
      } else {
        await createCustomer(form)
      }
      closeModal()
    } catch (error) {
      console.error('Error saving customer:', error)
    }
  }

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return
    
    try {
      await deleteCustomer(customerToDelete.id)
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (error) {
      // Error handling is already done in the mutation
      console.error('Delete error:', error)
    }
  }

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false)
    toast.success('Customer checked in successfully')
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPage(1) // Reset to first page when searching
  }

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    if (isMultiSelectMode) {
      setSelectedCustomers(new Set()) // Clear selections when exiting multi-select mode
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
  }

  const selectAllCustomers = () => {
    const allCustomerIds = customers.map(customer => customer.id)
    setSelectedCustomers(new Set(allCustomerIds))
  }

  const clearAllSelections = () => {
    setSelectedCustomers(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedCustomers.size === 0) return
    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    const selectedCustomerIds = Array.from(selectedCustomers)
    
    try {
      // Use the bulk delete mutation
      await bulkDeleteCustomers(selectedCustomerIds)
      
      // Clear selections after successful deletion
      setSelectedCustomers(new Set())
      setBulkDeleteDialogOpen(false)
    } catch (error) {
      console.error('Bulk delete error:', error)
      // Error handling is done in the mutation
    }
  }

  if (isLoading && (!customers || customers.length === 0)) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={5} />
        <DataTableSkeleton rows={8} columns={6} />
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
            <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load customers"
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
          <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={toggleMultiSelectMode}
            variant={isMultiSelectMode ? "default" : "outline"}
            className={`w-full sm:w-auto ${isMultiSelectMode ? 'bg-primary hover:bg-primary/90 text-white' : ''}`}
          >
            {isMultiSelectMode ? <span className="text-sm mr-2">☑</span> : <span className="text-sm mr-2">☐</span>}
            {isMultiSelectMode ? 'Exit Multi-Select' : 'Multi-Select'}
          </Button>
          <Button 
            onClick={() => setShowCheckInModal(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <span className="text-sm mr-2">✓</span>
            Check In
          </Button>
          <Button onClick={() => openAddEditModal(null)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <span className="text-sm text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <span className="text-sm text-muted-foreground">🗓️</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.new_this_month}</div>
            <p className="text-xs text-muted-foreground">
              new customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <span className="text-sm text-muted-foreground">✓</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.active_this_month}</div>
            <p className="text-xs text-muted-foreground">
              active customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <span className="text-sm text-muted-foreground">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total_visits}</div>
            <p className="text-xs text-muted-foreground">
              total visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visits</CardTitle>
            <span className="text-sm text-muted-foreground">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.average_visits}</div>
            <p className="text-xs text-muted-foreground">
              per customer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Customers</CardTitle>
            {isMultiSelectMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCustomers.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllCustomers}
                  disabled={selectedCustomers.size === customers.length}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllSelections}
                  disabled={selectedCustomers.size === 0}
                >
                  Clear All
                </Button>
                {selectedCustomers.size > 0 && role === 'admin' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    <span className="text-sm mr-1">🗑️</span>
                    Delete Selected
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl text-gray-400 mx-auto mb-4 block">👥</span>
              <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first customer.</p>
              <Button onClick={() => openAddEditModal(null)} className="bg-primary hover:bg-primary/90 text-white">
                <span className="text-sm mr-2">➕</span>
                Add Customer
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 border rounded-lg ${
                      isMultiSelectMode && selectedCustomers.has(customer.id)
                        ? 'bg-muted border-border'
                        : ''
                    } ${isMultiSelectMode ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={isMultiSelectMode ? () => toggleCustomerSelection(customer.id) : undefined}
                  >
                    <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                      {isMultiSelectMode && (
                        <Checkbox
                          checked={selectedCustomers.has(customer.id)}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-xs flex-shrink-0">✉️</span>
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-xs flex-shrink-0">📞</span>
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 text-sm text-muted-foreground">
                      <p>Member since {formatDateGB(customer.created_at)}</p>
                    </div>
                    <div className="hidden lg:block col-span-1">
                      {/* Placeholder for future data */}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <span className="text-xs sm:text-sm">👁️</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAddEditModal(customer)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <span className="text-xs sm:text-sm">✏️</span>
                      </Button>
                      {role === 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(customer)}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                        >
                          <span className="text-xs sm:text-sm">🗑️</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} customers
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="text-xs sm:text-sm"
                  >
                    <span className="text-xs sm:text-sm mr-1">‹</span>
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
                    <span className="text-xs sm:text-sm ml-1">›</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialValues={editingCustomer}
      />

      {/* Visit Check-In Modal */}
      <VisitCheckInModal
        open={showCheckInModal}
        onOpenChange={setShowCheckInModal}
        staffId={user?.id || ''}
        onSuccess={handleCheckInSuccess}
      />

      {/* Delete Dialog */}
      <CustomerDeleteDialog
        customer={customerToDelete}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Bulk Delete Dialog */}
      <CustomerBulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        selectedCustomers={customers.filter(customer => selectedCustomers.has(customer.id))}
        isDeleting={isBulkDeleting}
      />
    </div>
  )
} 