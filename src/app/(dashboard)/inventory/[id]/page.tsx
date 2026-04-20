"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchInventoryItemById, adjustStock, getInventoryLogs } from "@/lib/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, TrendingUp, Package, Clock } from "lucide-react"
import { format } from "date-fns"
import { InventoryItem, InventoryLog, StockAdjustmentData } from "@/types/inventory"
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal"
import { 
  getCategoryColor, 
  getCategoryIcon, 
  getStockStatus, 
  formatCurrency,
  getReasonLabel,
  getReasonColor
} from "@/lib/inventory"
import { ErrorAlert, TableSkeleton } from "@/components/ui/loading-states"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function InventoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
  const [error, setError] = useState<string>("")

  const loadData = useCallback(async () => {
    const itemId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!itemId) return
    try {
      setLoading(true)
      setError("")
      const [itemData, logsData] = await Promise.all([
        fetchInventoryItemById(itemId),
        getInventoryLogs(itemId, 100)
      ])
      setItem(itemData)
      setLogs(logsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load inventory item"
      setError(errorMessage)
      toast.error("Failed to load inventory item", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openAdjustmentModal = () => {
    setAdjustmentModalOpen(true)
  }

  const closeAdjustmentModal = () => {
    setAdjustmentModalOpen(false)
  }

  const handleAdjustStock = async (adjustmentData: StockAdjustmentData) => {
    try {
      await adjustStock(adjustmentData)
      await loadData() // Refresh data
      toast.success("Stock adjusted successfully")
      closeAdjustmentModal()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to adjust stock"
      toast.error("Failed to adjust stock", { description: errorMessage })
      throw error
    }
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
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
            <Skeleton className="h-10 w-28" />
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
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={5} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <ErrorAlert 
          title="Failed to load inventory item"
          message={error || "Inventory item not found"}
          onRetry={loadData}
        />
      </div>
    )
  }

  const currentQuantity = item.quantity ?? item.current_stock
  const threshold = item.threshold ?? item.min_stock_level
  const stockStatus = getStockStatus(currentQuantity, threshold)

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
            <h1 className="text-2xl font-bold">{item.item_name ?? item.name}</h1>
            <p className="text-muted-foreground">Inventory item details and history</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/inventory/${item.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={openAdjustmentModal}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Item Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Item Name</p>
                  <p className="font-medium">{item.item_name ?? item.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge className={getCategoryColor(item.category)}>
                    {getCategoryIcon(item.category)} {item.category}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Quantity</p>
                  <p className={`text-2xl font-bold ${
                    currentQuantity === 0 ? 'text-red-600' : 
                    currentQuantity <= threshold ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {currentQuantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Threshold</p>
                  <p className="text-2xl font-bold">{threshold}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.cost ?? null)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Stock Status</p>
                <Badge className={stockStatus.color}>
                  {stockStatus.icon} {stockStatus.status}
                </Badge>
              </div>

              {item.cost && (
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency((item.cost ?? 0) * currentQuantity)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Stock History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const change = log.change ?? log.quantity_change
                      const reason = log.reason ?? log.action
                      return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getReasonColor(reason)}>
                            {getReasonLabel(reason)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.notes ? (
                            <p className="text-sm text-muted-foreground">{log.notes}</p>
                          ) : (
                            <span className="text-sm text-gray-400">No notes</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )})}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                          No stock history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(item.last_updated ?? item.updated_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(item.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => {
                  const change = log.change ?? log.quantity_change
                  return (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {change > 0 ? '+' : ''}{change} units
                      </p>
                      <p className="text-xs text-muted-foreground">{getReasonLabel(log.reason ?? log.action)}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(log.created_at), "MMM d")}
                    </span>
                  </div>
                )})}
                {logs.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Item Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Item ID</p>
                <p className="font-mono text-sm">{item.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(item.last_updated ?? item.updated_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(item.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StockAdjustmentModal
        open={adjustmentModalOpen}
        onClose={closeAdjustmentModal}
        onSubmit={handleAdjustStock}
        item={item}
      />
    </div>
  )
} 