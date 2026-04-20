import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorAlert, StatsSkeleton } from "@/components/ui/loading-states";
import { getAnalyticsData } from "@/lib/analytics";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Define the analytics data type based on what getAnalyticsData returns
interface AnalyticsData {
  bookings: {
    total: number;
    thisMonth: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    averagePartySize: number;
    bookingsByDay: Array<{ date: string; count: number; revenue?: number }>;
  };
  customers: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
    loyaltyMembers: number;
    averageVisits: number;
    topSpenders: Array<{ name: string; totalSpent: number }>;
  };
  events: {
    total: number;
    upcoming: number;
    totalRSVPs: number;
    averageAttendance: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    averagePerBooking: number;
    topCategories: Array<{ category: string; revenue: number }>;
  };
}

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const [isSampleData, setIsSampleData] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch booking, revenue, and chart data from dedicated API endpoints for accurate data
      const [bookingStatsResponse, revenueStatsResponse, revenueByDayResponse, analyticsData] = await Promise.all([
        fetch('/api/bookings/stats').then(res => res.json()).catch(() => ({
          total_bookings: 0,
          confirmed_bookings: 0,
          pending_bookings: 0,
          cancelled_bookings: 0,
          completed_bookings: 0,
          average_party_size: 0
        })),
        fetch('/api/bookings/revenue').then(res => res.json()).catch(() => ({
          total_revenue: 0,
          this_month_revenue: 0,
          average_per_booking: 0,
          total_bookings: 0
        })),
        fetch('/api/bookings/by-day').then(res => res.json()).catch(() => ({
          bookingsByDay: [],
          totalDays: 0,
          totalBookings: 0,
          isSampleData: false
        })),
        getAnalyticsData().catch(error => {
          console.warn("Analytics data failed, using fallback:", error);
          return {
            customers: { total: 0, newThisMonth: 0, activeThisMonth: 0, loyaltyMembers: 0, averageVisits: 0, topSpenders: [] },
            bookings: { total: 0, thisMonth: 0, confirmed: 0, pending: 0, cancelled: 0, averagePartySize: 0, bookingsByDay: [] },
            events: { total: 0, upcoming: 0, totalRSVPs: 0, averageAttendance: 0 },
            inventory: { totalItems: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
            revenue: { total: 0, thisMonth: 0, averagePerBooking: 0, topCategories: [] }
          };
        })
      ]);

      // Use the dedicated booking, revenue, and chart data for more accurate data
      const enhancedData = {
        ...analyticsData,
        bookings: {
          ...analyticsData.bookings,
          total: bookingStatsResponse.total_bookings || 0,
          confirmed: bookingStatsResponse.confirmed_bookings || 0,
          pending: bookingStatsResponse.pending_bookings || 0,
          cancelled: bookingStatsResponse.cancelled_bookings || 0,
          completed: bookingStatsResponse.completed_bookings || 0,
          averagePartySize: bookingStatsResponse.average_party_size || 0,
          bookingsByDay: revenueByDayResponse.bookingsByDay || [],
        },
        revenue: {
          ...analyticsData.revenue,
          total: revenueStatsResponse.total_revenue || 0,
          thisMonth: revenueStatsResponse.this_month_revenue || 0,
          averagePerBooking: revenueStatsResponse.average_per_booking || 0,
        }
      };

      console.log('Enhanced analytics data loaded:', enhancedData);
      
      // Track if we're using sample data
      setIsSampleData(revenueByDayResponse.isSampleData || false);
      
      // Log if we're using sample data
      if (revenueByDayResponse.isSampleData) {
        console.log('📊 Chart is showing sample data for demonstration');
      }
      
      setData(enhancedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StatsSkeleton />;
  }
  if (error) {
    return <ErrorAlert title="Failed to load analytics" message={error} onRetry={loadData} />;
  }
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Revenue by Day */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Revenue by Day</span>
              {isSampleData && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300 px-2 py-1 rounded">
                  Sample Data
                </span>
              )}
            </div>
            {Array.isArray(data.bookings?.bookingsByDay) && data.bookings.bookingsByDay.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Last {data.bookings.bookingsByDay.length} days
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {Array.isArray(data.bookings?.bookingsByDay) && data.bookings.bookingsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.bookings.bookingsByDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === "number" ? `€${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="mb-2">No revenue data available</p>
                <p className="text-xs">Chart will populate when bookings are confirmed or completed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Status Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Booking Status Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center p-4 bg-green-50 dark:bg-green-500/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{data.bookings?.confirmed || 0}</div>
              <div className="text-sm text-green-800 dark:text-green-200">Confirmed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-500/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{data.bookings?.pending || 0}</div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-500/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-300">{data.bookings?.cancelled || 0}</div>
              <div className="text-sm text-red-700 dark:text-red-200">Cancelled</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.bookings?.total || 0}</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Customer Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-500/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{data.customers?.total || 0}</div>
              <div className="text-sm text-purple-800 dark:text-purple-200">Total Customers</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{data.customers?.newThisMonth || 0}</div>
              <div className="text-sm text-indigo-800 dark:text-indigo-200">New This Month</div>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-500/20 rounded-lg">
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">{data.customers?.loyaltyMembers || 0}</div>
              <div className="text-sm text-pink-800 dark:text-pink-200">Loyalty Members</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-500/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{data.customers?.averageVisits?.toFixed(1) || 0}</div>
              <div className="text-sm text-orange-800 dark:text-orange-200">Avg Visits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center p-4 bg-green-50 dark:bg-green-500/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">€{(data.revenue?.total || 0).toLocaleString()}</div>
              <div className="text-sm text-green-800 dark:text-green-200">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/20 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">€{(data.revenue?.thisMonth || 0).toLocaleString()}</div>
              <div className="text-sm text-emerald-800 dark:text-emerald-200">This Month</div>
            </div>
            <div className="text-center p-4 bg-teal-50 dark:bg-teal-500/20 rounded-lg">
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">€{(data.revenue?.averagePerBooking || 0).toFixed(0)}</div>
              <div className="text-sm text-teal-800 dark:text-teal-200">Avg per Booking</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-500/20 rounded-lg">
              <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{data.bookings?.averagePartySize?.toFixed(1) || 0}</div>
              <div className="text-sm text-cyan-800 dark:text-cyan-200">Avg Party Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 