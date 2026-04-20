"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"
import { fetchCustomersWithDetails } from "@/lib/customers"
import { 
  getInventoryStats, 
  getLowStockAlerts 
} from "@/lib/inventory"
import { fetchBookings } from "@/lib/bookings"
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns"
import { CustomerWithDetails } from "@/types/customer"
import { BookingWithCustomer } from "@/types/booking"
import { LowStockAlert } from "@/types/inventory"
import { ErrorAlert } from "@/components/ui/loading-states"
import { DashboardHomeSkeleton } from "@/components/layout/DashboardHomeSkeleton"
import { toast } from "sonner"
import { AnalyticsSection } from "@/components/analytics/AnalyticsSection"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { useUIStore } from '@/stores/uiStore';

interface DashboardStats {
  totalCustomers: number
  bookingsThisWeek: number
  rsvpsThisMonth: number
  lowStockItems: number
  totalRevenue: number
  activeEvents: number
  pendingBookings: number
  topCustomers: CustomerWithDetails[]
  // New inventory and events stats
  inventoryStats: {
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
  }
  eventStats: {
    totalEvents: number
    upcomingEvents: number
    totalRSVPs: number
    avgAttendance: number
  }
}

interface StatCardProps {
  title: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
  color?: string
  onClick?: () => void
}

function DashboardContent() {
  const router = useRouter()
  const openAddCustomerModal = useUIStore(state => state.openAddCustomerModal)
  const openAddBookingModal = useUIStore(state => state.openAddBookingModal)
  const openAddEventModal = useUIStore(state => state.openAddEventModal)
  const openAddInventoryModal = useUIStore(state => state.openAddInventoryModal)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingWithCustomer[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all data in parallel with proper error handling
      const [
        customerStats,
        bookingStats,
        inventoryStats,
        eventStats,
        customers,
        bookings,
        todayBookings,
        alerts
      ] = await Promise.all([
        fetch('/api/customers?page=1&limit=1')
          .then(async (res) => {
            if (!res.ok) return { total_customers: 0 }
            const j = (await res.json()) as { count?: number }
            return { total_customers: j.count ?? 0 }
          })
          .catch((err) => {
            console.error('Dashboard: Error fetching customer stats:', err)
            return { total_customers: 0 }
          }),
        // Use API endpoint for booking stats instead of lib function
        fetch('/api/bookings/stats').then(res => res.json()).catch(err => {
          console.error('Dashboard: Error fetching booking stats:', err)
          return { total_bookings: 0, pending_bookings: 0, total_guests: 0 }
        }),
        getInventoryStats().catch(err => {
          console.error('Dashboard: Error fetching inventory stats:', err)
          return { low_stock_items: 0, total_items: 0, out_of_stock_items: 0, total_value: 0 }
        }),
        // Use API endpoint for event stats instead of lib function
        fetch('/api/events/stats').then(res => res.json()).catch(err => {
          console.error('Dashboard: Error fetching event stats:', err)
          return { total_events: 0, upcoming_events: 0, total_rsvps: 0, average_attendance: 0 }
        }),
        fetchCustomersWithDetails({ page: 1, limit: 10 }).catch((err) => {
          console.error('Dashboard: Error fetching customers:', err)
          return { data: [] }
        }),
        fetchBookings({ page: 1, limit: 5 }).catch(err => {
          console.error('Dashboard: Error fetching bookings:', err)
          return { data: [] }
        }),
        fetch('/api/bookings/today')
          .then(async (res) => {
            if (!res.ok) return []
            return (await res.json()) as BookingWithCustomer[]
          })
          .catch((err) => {
            console.error('Dashboard: Error fetching today bookings:', err)
            return []
          }),
        getLowStockAlerts().catch(err => {
          console.error('Dashboard: Error fetching low stock alerts:', err)
          return []
        })
      ])

      console.log('Dashboard data loaded:', {
        customerStats,
        bookingStats,
        inventoryStats,
        eventStats,
        bookingsCount: bookings.data?.length || 0,
        todayBookingsCount: todayBookings.length
      })

      // Calculate week/month metrics
      const now = new Date()
      const weekStart = startOfWeek(now)
      const weekEnd = endOfWeek(now)

      const bookingsThisWeek = Array.isArray(bookings.data) ? bookings.data.filter((booking: BookingWithCustomer) => 
        isWithinInterval(new Date(booking.date || booking.booking_date), { start: weekStart, end: weekEnd })
      ).length : 0

      const rsvpsThisMonth = eventStats.total_rsvps || 0

      const topCustomers = Array.isArray(customers?.data) ? customers.data
        .sort((a: CustomerWithDetails, b: CustomerWithDetails) => {
          return (b.total_visits || 0) - (a.total_visits || 0)
        })
        .slice(0, 5) : []

      const dashboardStats: DashboardStats = {
        totalCustomers: customerStats?.total_customers || 0,
        bookingsThisWeek,
        rsvpsThisMonth,
        lowStockItems: inventoryStats?.low_stock_items || 0,
        totalRevenue: (bookingStats?.total_guests || 0) * 25,
        activeEvents: eventStats?.total_events || 0,
        pendingBookings: bookingStats?.pending_bookings || 0,
        topCustomers,
        inventoryStats: {
          totalItems: inventoryStats?.total_items || 0,
          lowStockItems: inventoryStats?.low_stock_items || 0,
          outOfStockItems: inventoryStats?.out_of_stock_items || 0,
          totalValue: inventoryStats?.total_value || 0
        },
        eventStats: {
          totalEvents: eventStats?.total_events || 0,
          upcomingEvents: eventStats?.upcoming_events || 0,
          totalRSVPs: eventStats?.total_rsvps || 0,
          avgAttendance: eventStats?.average_attendance || 0
        }
      }

      setStats(dashboardStats)

      // Ensure todayBookings is an array
      const safeTodayBookings = Array.isArray(todayBookings) ? todayBookings : []
      setRecentBookings(safeTodayBookings)
      
      // Ensure alerts is an array
      const safeAlerts = Array.isArray(alerts) ? alerts : []
      setLowStockAlerts(safeAlerts)

    } catch (dashboardError) {
      console.error("Dashboard: Failed to load dashboard data:", dashboardError)
      setError("Failed to load dashboard data. Please try again later.")
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    trend, 
    trendValue, 
    color = "blue",
    onClick 
  }: StatCardProps) => (
    <Card
      data-color={color}
      className={`${onClick ? 'cursor-pointer transition-colors hover:bg-muted/50' : 'cursor-default'}`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-semibold text-foreground truncate mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs sm:text-sm ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {trend === "up" ? "↑" : "↓"} {trendValue}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <DashboardHomeSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Error loading dashboard data</p>
          </div>
        </div>
        <ErrorAlert 
          title="Failed to load dashboard data"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => router.push('/customers')}>
            <span className="hidden sm:inline">View Customers</span>
            <span className="sm:hidden">Customers</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/bookings')}>
            <span className="hidden sm:inline">View Bookings</span>
            <span className="sm:hidden">Bookings</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            trend="up"
            trendValue="+12% this month"
            color="blue"
          />
          <StatCard
            title="Bookings This Week"
            value={stats.bookingsThisWeek}
            trend="up"
            trendValue="+8% vs last week"
            color="green"
          />
          <StatCard
            title="RSVPs This Month"
            value={stats.rsvpsThisMonth}
            trend="up"
            trendValue="+15% vs last month"
            color="purple"
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            trend="down"
            trendValue="-5% vs last week"
            color="red"
          />
        </div>
      )}

      {/* --- Analytics Section --- */}
      <AnalyticsSection />

      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Estimated Revenue"
            value={`€${stats.totalRevenue.toLocaleString()}`}
            color="green"
          />
          <StatCard
            title="Active Events"
            value={stats.activeEvents}
            color="purple"
          />
          <StatCard
            title="Pending Bookings"
            value={stats.pendingBookings}
            color="yellow"
          />
        </div>
      )}

      {/* Summary Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Inventory Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.inventoryStats.totalItems}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Items</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.inventoryStats.lowStockItems}</p>
                  <p className="text-xs text-muted-foreground mt-1">Low Stock</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.inventoryStats.outOfStockItems}</p>
                  <p className="text-xs text-muted-foreground mt-1">Out of Stock</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">€{stats.inventoryStats.totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Events Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.eventStats.totalEvents}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Events</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.eventStats.upcomingEvents}</p>
                  <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.eventStats.totalRSVPs}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total RSVPs</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.eventStats.avgAttendance.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visits Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                Visits Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Customers</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.bookingsThisWeek}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bookings This Week</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.rsvpsThisMonth}</p>
                  <p className="text-xs text-muted-foreground mt-1">RSVPs This Month</p>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <p className="text-2xl font-semibold text-foreground">{stats.pendingBookings}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
              <CardTitle>
              Today&apos;s Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(recentBookings) && recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border border-border rounded">
                    <div>
                      <p className="font-medium text-foreground">{booking.customer?.name || 'Unknown Customer'}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.time || booking.start_time} • {booking.party_size} guests
                      </p>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No bookings for today</p>
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/bookings')}
            >
              View All Bookings
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
              <CardTitle>
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(lowStockAlerts) && lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded">
                    <div>
                      <p className="font-medium text-foreground">{alert.item_name}</p>
                      <p className="text-sm text-muted-foreground">{alert.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{alert.current_quantity}</p>
                      <p className="text-xs text-muted-foreground">of {alert.threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>All items are well stocked</p>
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/inventory')}
            >
              View Inventory
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      {stats && stats.topCustomers.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle>
              Top Customers by Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(stats.topCustomers) && stats.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-border rounded flex items-center justify-center flex-shrink-0 bg-muted">
                      <span className="text-sm font-semibold text-foreground">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{customer?.name || 'Unknown Customer'}</p>
                      <p className="text-sm text-muted-foreground truncate">{customer?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-foreground">{(customer as any)?.lifetime_visits || customer?.total_visits || 0} visits</p>
                    <p className="text-xs text-muted-foreground">
                      {(customer as any)?.loyalty_tier ? `${(customer as any).loyalty_tier} member` : 'Loyalty member'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/customers')}
            >
              View All Customers
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Staff Actions */}
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 p-2"
              onClick={() => {
                router.push('/customers');
                setTimeout(() => {
                  openAddCustomerModal();
                }, 100);
              }}
            >
              <span className="text-xs sm:text-sm text-center">Add Customer</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 p-2"
              onClick={() => {
                router.push('/bookings');
                setTimeout(() => {
                  openAddBookingModal();
                }, 100);
              }}
            >
              <span className="text-xs sm:text-sm text-center">New Booking</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 p-2"
              onClick={() => {
                router.push('/events');
                setTimeout(() => {
                  openAddEventModal();
                }, 100);
              }}
            >
              <span className="text-xs sm:text-sm text-center">Create Event</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 p-2"
              onClick={() => {
                router.push('/inventory');
                setTimeout(() => {
                  openAddInventoryModal();
                }, 100);
              }}
            >
              <span className="text-xs sm:text-sm text-center">Add Item</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Something went wrong loading the dashboard</p>
            </div>
          </div>
          <ErrorAlert 
            title="Dashboard Error"
            message="There was an error loading the dashboard data. Please refresh the page or try again later."
            onRetry={() => window.location.reload()}
          />
        </div>
      }
    >
      <DashboardContent />
    </ErrorBoundary>
  )
} 