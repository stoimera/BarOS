"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Loader2,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';
import { EventPerformance, EventOptimization } from '@/types/event';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });

interface EventAnalytics {
  total_events: number;
  total_revenue: number;
  average_attendance_rate: number;
  average_profit_margin: number;
  average_revenue_per_event: number;
  top_revenue_source: string;
  average_capacity_utilization: number;
  peak_attendance_time: string;
}

export default function EnhancedEventsDashboardPage() {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [performances, setPerformances] = useState<EventPerformance[]>([]);
  const [optimizations, setOptimizations] = useState<EventOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ analytics: EventAnalytics; performances: EventPerformance[] }>('events/analytics');
      
      const { analytics: analyticsData, performances: performancesData } = response.data;
      setAnalytics(analyticsData);
      setPerformances(performancesData);
      
      // Get optimization data for top events
      const optimizationPromises = performancesData.slice(0, 5).map(async (p: EventPerformance) => {
        try {
          const optResponse = await api.get<EventOptimization>(`events/optimization/${p.event_id}`);
          return optResponse.data;
        } catch {
          return null;
        }
      });
      
      const optimizationData = await Promise.all(optimizationPromises);
      setOptimizations(optimizationData.filter(Boolean) as EventOptimization[]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load enhanced events data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    const fixedAmount = Number(amount).toFixed(2)
    return `€${fixedAmount}`;
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 60) return <Badge variant="secondary">Good</Badge>;
    if (rate >= 40) return <Badge variant="outline" className="text-yellow-600">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return <Badge variant={variants[impact] || "outline"}>{impact}</Badge>;
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
        <PageHeaderSkeleton showActions={false} />
        <StatCardSkeleton count={8} />
        <ChartSkeleton height={300} />
        <DataTableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.total_events || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-24" /> : <div className="text-lg sm:text-2xl font-bold">{formatCurrency(analytics?.total_revenue || 0)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.average_attendance_rate?.toFixed(1) || 0}%</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.average_profit_margin?.toFixed(1) || 0}%</div>}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="optimization" className="text-xs sm:text-sm">Optimization</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="top-events" className="text-xs sm:text-sm">Top Events</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Event Performance Overview
            </h2>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : loading ? (
              <Skeleton className="h-48 sm:h-64 w-full" />
            ) : performances.length ? (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performances.slice(0, 10)} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <XAxis dataKey="event_title" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => String(value)} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 text-sm sm:text-base">No performance data available.</div>
            )}
          </div>

          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Performance Details</h2>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : loading ? (
              <Skeleton className="h-40 w-full" />
            ) : performances.length ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Margin</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performances.slice(0, 10).map(performance => (
                        <TableRow key={performance.event_id}>
                          <TableCell className="font-medium">{performance.event_title}</TableCell>
                          <TableCell>{format(performance.event_date, 'MMM d, yyyy')}</TableCell>
                          <TableCell>{performance.attendance_rate.toFixed(1)}%</TableCell>
                          <TableCell>{formatCurrency(performance.revenue)}</TableCell>
                          <TableCell>{formatCurrency(performance.profit)}</TableCell>
                          <TableCell>{performance.profit_margin.toFixed(1)}%</TableCell>
                          <TableCell>{getPerformanceBadge(performance.attendance_rate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {performances.slice(0, 10).map(performance => (
                    <div
                      key={performance.event_id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm sm:text-base">{performance.event_title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{format(performance.event_date, 'MMM d, yyyy')}</span>
                          {getPerformanceBadge(performance.attendance_rate)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Attendance</div>
                          <div className="font-medium">{performance.attendance_rate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Revenue</div>
                          <div className="font-medium">{formatCurrency(performance.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Profit</div>
                          <div className="font-medium">{formatCurrency(performance.profit)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Margin</div>
                          <div className="font-medium">{performance.profit_margin.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No performance data available.</div>
            )}
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5" /> Optimization Suggestions
            </h2>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : loading ? (
              <Skeleton className="h-40 w-full" />
            ) : optimizations.length ? (
              <div className="space-y-4">
                {optimizations.slice(0, 5).map((optimization, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">Event Optimization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {optimization.suggestions.map((suggestion, suggestionIndex) => (
                          <div key={suggestionIndex} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm sm:text-base">{suggestion.title}</h4>
                              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getImpactBadge(suggestion.impact)}
                              <span className="text-sm text-green-600">+{suggestion.estimated_improvement}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No optimization data available.</div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Detailed Analytics</h2>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : loading ? (
              <Skeleton className="h-40 w-full" />
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Revenue Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Average Revenue per Event:</span>
                      <span className="font-medium">{formatCurrency(analytics.average_revenue_per_event || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Top Revenue Source:</span>
                      <span className="font-medium">{analytics.top_revenue_source || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Attendance Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Average Capacity:</span>
                      <span className="font-medium">{analytics.average_capacity_utilization?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Peak Attendance Time:</span>
                      <span className="font-medium">{analytics.peak_attendance_time || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No analytics data available.</div>
            )}
          </div>
        </TabsContent>

        {/* Top Events Tab */}
        <TabsContent value="top-events" className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">Top Performing Events</h2>
            {error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : loading ? (
              <Skeleton className="h-40 w-full" />
            ) : performances.length ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Profit Margin</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performances.slice(0, 10).map((performance, index) => (
                        <TableRow key={performance.event_id}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell className="font-medium">{performance.event_title}</TableCell>
                          <TableCell>{formatCurrency(performance.revenue)}</TableCell>
                          <TableCell>{performance.attendance_rate.toFixed(1)}%</TableCell>
                          <TableCell>{performance.profit_margin.toFixed(1)}%</TableCell>
                          <TableCell>{getPerformanceBadge(performance.attendance_rate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {performances.slice(0, 10).map((performance, index) => (
                    <div
                      key={performance.event_id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        {getPerformanceBadge(performance.attendance_rate)}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">{performance.event_title}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Revenue</div>
                          <div className="font-medium">{formatCurrency(performance.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Attendance</div>
                          <div className="font-medium">{performance.attendance_rate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Profit Margin</div>
                          <div className="font-medium">{performance.profit_margin.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No top events data available.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 