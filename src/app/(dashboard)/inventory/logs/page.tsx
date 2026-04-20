"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getInventoryLogs } from "@/lib/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Package, Clock, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { InventoryLog } from "@/types/inventory"
import { 
  getReasonLabel, 
  getReasonColor, 
  getCategoryColor, 
  getCategoryIcon 
} from "@/lib/inventory"
import { ErrorAlert, EmptyState, StatsSkeleton, TableSkeleton } from "@/components/ui/loading-states"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function InventoryLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [search, setSearch] = useState("")
  const [reasonFilter, setReasonFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getInventoryLogs(undefined, 100)
      setLogs(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load inventory logs"
      setError(errorMessage)
      toast.error("Failed to load inventory logs", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search || 
      log.item?.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.notes?.toLowerCase().includes(search.toLowerCase())
    
    const matchesReason = reasonFilter === "all" || log.reason === reasonFilter
    const matchesCategory = categoryFilter === "all" || log.item?.category === categoryFilter

    return matchesSearch && matchesReason && matchesCategory
  })

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
  }

  const getTotalChange = (logs: InventoryLog[]) => {
    return logs.reduce((sum, log) => sum + (log.change ?? log.quantity_change), 0)
  }

  const getTotalPurchases = (logs: InventoryLog[]) => {
    return logs
      .filter(log => (log.reason ?? log.action) === 'purchase')
      .reduce((sum, log) => sum + (log.change ?? log.quantity_change), 0)
  }

  const getTotalUsage = (logs: InventoryLog[]) => {
    return Math.abs(
      logs
        .filter(log => (log.reason ?? log.action) === 'usage')
        .reduce((sum, log) => sum + (log.change ?? log.quantity_change), 0)
    )
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
        </div>

        {/* Stats Skeleton */}
        <StatsSkeleton />

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Skeleton className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={8} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Inventory Activity</h1>
              <p className="text-muted-foreground">Track all inventory changes and adjustments</p>
            </div>
          </div>
        </div>

        <ErrorAlert 
          title="Failed to load inventory logs"
          message={error}
          onRetry={loadLogs}
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
            <h1 className="text-2xl font-bold">Inventory Activity</h1>
            <p className="text-muted-foreground">Track all inventory changes and adjustments</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Change</p>
                <p className={`text-2xl font-bold ${
                  getTotalChange(filteredLogs) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getTotalChange(filteredLogs) > 0 ? '+' : ''}{getTotalChange(filteredLogs)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-green-600">+{getTotalPurchases(filteredLogs)}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-red-600">-{getTotalUsage(filteredLogs)}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by item name or notes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <Select value={reasonFilter} onValueChange={setReasonFilter} disabled={loading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="purchase">📦 Purchase</SelectItem>
                <SelectItem value="usage">🍺 Usage</SelectItem>
                <SelectItem value="correction">🔧 Correction</SelectItem>
                <SelectItem value="waste">🗑️ Waste</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading}>
              <SelectTrigger className="w-40">
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
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No activity found"
                description={search || reasonFilter !== "all" || categoryFilter !== "all" 
                  ? "No logs match your current filters." 
                  : "No inventory activity has been recorded yet."}
                action={
                  search || reasonFilter !== "all" || categoryFilter !== "all" ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearch("")
                        setReasonFilter("all")
                        setCategoryFilter("all")
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
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
                        <div className="space-y-1">
                          <p className="font-medium">{log.item?.item_name ?? log.item?.name ?? 'Unknown Item'}</p>
                          <p className="text-xs text-gray-500">ID: {log.item_id ?? log.inventory_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.item?.category && (
                          <Badge className={getCategoryColor(log.item.category)}>
                            {getCategoryIcon(log.item.category)} {log.item.category}
                          </Badge>
                        )}
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
                          <p className="text-sm text-muted-foreground line-clamp-2">{log.notes}</p>
                        ) : (
                          <span className="text-sm text-gray-400">No notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 