"use client"

import { useState, useEffect } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData, StockAdjustmentData } from '@/types/inventory'
import { InventoryFormModal } from '@/components/inventory/InventoryFormModal'
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ErrorAlert, 
  TableSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  InventoryItemSkeleton
} from '@/components/ui/loading-states'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit,
  Trash2,
  TrendingUp,
  Euro,
  Package2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useUserRole } from '@/hooks/useUserRole'

function InventoryContent() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false)
  const [page, setPage] = useState(1)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const modalOpen = useUIStore(state => state.addInventoryModalOpen)
  const openAddInventoryModal = useUIStore(state => state.openAddInventoryModal)
  const closeAddInventoryModal = useUIStore(state => state.closeAddInventoryModal)
  
  useAuthStore()
  const { role } = useUserRole()

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, lowStockFilter])

  // Use React Query hook for inventory
  const {
    inventory,
    totalCount,
    stats,
    lowStockAlerts,
    isLoading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    isCreating,
    isUpdating,
    isAdjusting
  } = useInventory({
    search,
    category: categoryFilter !== "all" ? [categoryFilter as 'drinks' | 'raw_material' | 'food' | 'utensils'] : undefined,
    low_stock: lowStockFilter,
    page,
    limit: 20
  })

  const openAddModal = () => {
    setEditingItem(null)
    openAddInventoryModal()
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    openAddInventoryModal()
  }

  const openAdjustmentModal = (item: InventoryItem) => {
    setAdjustingItem(item)
    setAdjustmentModalOpen(true)
  }

  const closeFormModal = () => {
    setEditingItem(null)
    closeAddInventoryModal()
  }

  const closeAdjustmentModal = () => {
    setAdjustingItem(null)
    setAdjustmentModalOpen(false)
  }

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setItemToDelete(null)
    setDeleteModalOpen(false)
  }

  const handleSaveItem = async (form: CreateInventoryItemData | UpdateInventoryItemData) => {
    try {
      if (editingItem) {
        console.log('Updating item:', editingItem.id, 'with form data:', form)
        await updateInventoryItem({ id: editingItem.id, data: form as UpdateInventoryItemData })
      } else {
        console.log('Creating new item with form data:', form)
        await createInventoryItem(form as CreateInventoryItemData)
      }
      closeFormModal()
    } catch (error) {
      console.error('Error in handleSaveItem:', error)
      // Error handling is done in the mutation
      throw error
    }
  }

  const handleAdjustStock = async (adjustmentData: StockAdjustmentData) => {
    try {
      await adjustStock(adjustmentData)
      closeAdjustmentModal()
    } catch (error) {
      // Error handling is done in the mutation
      throw error
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      await deleteInventoryItem(itemToDelete.id)
      closeDeleteModal()
      // Success toast is handled by the mutation
    } catch (error) {
      console.error('Delete error in component:', error)
      // Error toast is handled by the mutation
    } finally {
      setDeleting(false)
    }
  }

  const getStockStatus = (currentStock: number, threshold: number) => {
    if (currentStock === 0) {
      return { status: 'out_of_stock', color: 'text-red-600', icon: <XCircle className="h-4 w-4" /> }
    } else if (currentStock <= threshold) {
      return { status: 'low_stock', color: 'text-yellow-600', icon: <AlertTriangle className="h-4 w-4" /> }
    } else {
      return { status: 'in_stock', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> }
    }
  }

  if (isLoading && inventory.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={6} />
        <InventoryItemSkeleton count={8} />
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
            <h1 className="text-2xl sm:text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Manage your restaurant inventory</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load inventory"
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
          <h1 className="text-2xl sm:text-3xl font-bold">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your restaurant inventory and stock levels</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={openAddModal} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_items}</div>
              <p className="text-xs text-muted-foreground">
                {stats.categories.drinks + stats.categories.raw_material + stats.categories.food + stats.categories.utensils} categories
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.low_stock_items}</div>
              <p className="text-xs text-muted-foreground">
                {stats.out_of_stock_items} out of stock
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.total_value)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_activity} recent changes
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Drinks:</span>
                  <span>{stats.categories.drinks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food:</span>
                  <span>{stats.categories.food}</span>
                </div>
                <div className="flex justify-between">
                  <span>Raw Material:</span>
                  <span>{stats.categories.raw_material}</span>
                </div>
                <div className="flex justify-between">
                  <span>Utensils:</span>
                  <span>{stats.categories.utensils}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts ({lowStockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 border border-border rounded">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{alert.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.current_quantity} / {alert.threshold} units
                    </p>
                  </div>
                </div>
              ))}
              {lowStockAlerts.length > 6 && (
                  <div className="col-span-full text-center text-sm text-destructive">
                  And {lowStockAlerts.length - 6} more items need attention...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="drinks">Drinks</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="raw_material">Raw Material</SelectItem>
                <SelectItem value="utensils">Utensils</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={lowStockFilter ? "default" : "outline"}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className="w-full sm:w-auto"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Low Stock Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card className="">
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No inventory items found</h3>
              <p className="text-muted-foreground mb-4">
                {search || categoryFilter !== "all" || lowStockFilter
                  ? "Try adjusting your filters to see more items."
                  : "Get started by adding your first inventory item."}
              </p>
              {!search && categoryFilter === "all" && !lowStockFilter && (
                <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map((item) => {
                const stockStatus = getStockStatus(item.current_stock, item.min_stock_level)
                return (
                  <div key={item.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div className="col-span-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      <p className={`font-medium ${stockStatus.color}`}>
                        {stockStatus.icon}
                        {item.current_stock} units
                      </p>
                      <p className="text-muted-foreground">Threshold: {item.min_stock_level}</p>
                    </div>
                    <div className="col-span-1 text-sm">
                      {item.cost ? (
                        <>
                          <p className="font-medium">{formatCurrency(item.cost)}</p>
                          <p className="text-muted-foreground">per unit</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-400">-</p>
                          <p className="text-gray-400">-</p>
                        </>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAdjustmentModal(item)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {role === 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteModal(item)}
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {inventory.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount} items
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {Math.ceil(totalCount / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={page >= Math.ceil(totalCount / 20)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Form Modal */}
      <InventoryFormModal
        open={modalOpen}
        onClose={closeFormModal}
        onSubmit={handleSaveItem}
        item={editingItem}
        loading={isCreating || isUpdating}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={adjustmentModalOpen}
        onClose={closeAdjustmentModal}
        onSubmit={handleAdjustStock}
        item={adjustingItem}
        loading={isAdjusting}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={closeDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Delete Inventory Item
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {itemToDelete && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{itemToDelete.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {itemToDelete.category} • {itemToDelete.current_stock} units
                      {itemToDelete.cost && ` • ${formatCurrency(itemToDelete.cost)} per unit`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted border border-border p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Warning
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Deleting this inventory item will remove it from your inventory system. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Inventory Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function InventoryPage() {
  return <InventoryContent />
} 