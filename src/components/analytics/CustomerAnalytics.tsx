'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/utils/business-logic'
import { handleComponentError } from '@/utils/error-handling'
import { CustomerWithDetails } from '@/types/customer'
import { fetchCustomersWithDetails } from '@/lib/customers'

interface CustomerAnalytics {
  totalCustomers: number
  newCustomersThisMonth: number
  activeCustomers: number
  averageRating: number
  totalRevenue: number
  averageOrderValue: number
  customerRetentionRate: number
  topCustomers: CustomerWithDetails[]
  customerSegments: {
    segment: string
    count: number
    percentage: number
  }[]
  monthlyGrowth: {
    month: string
    customers: number
    revenue: number
  }[]
}

export function CustomerAnalytics() {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  const calculateCustomerSegments = useCallback((customers: CustomerWithDetails[]) => {
    const segments = [
      { name: 'VIP', filter: (c: CustomerWithDetails) => (c.total_spent || 0) >= 500 },
      { name: 'Regular', filter: (c: CustomerWithDetails) => (c.total_spent || 0) >= 100 && (c.total_spent || 0) < 500 },
      { name: 'Occasional', filter: (c: CustomerWithDetails) => (c.total_spent || 0) >= 50 && (c.total_spent || 0) < 100 },
      { name: 'New', filter: (c: CustomerWithDetails) => (c.total_spent || 0) < 50 }
    ]

    return segments.map(segment => {
      const count = customers.filter(segment.filter).length
      return {
        segment: segment.name,
        count,
        percentage: customers.length > 0 ? (count / customers.length) * 100 : 0
      }
    })
  }, [])

  const calculateMonthlyGrowth = useCallback((customers: CustomerWithDetails[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1)
      const monthEnd = new Date(currentYear, index + 1, 0)
      
      const monthCustomers = customers.filter(c => {
        const createdDate = new Date(c.created_at)
        return createdDate >= monthStart && createdDate <= monthEnd
      })
      
      const monthRevenue = monthCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
      
      return {
        month,
        customers: monthCustomers.length,
        revenue: monthRevenue
      }
    })
  }, [])

  const calculateCustomerAnalytics = useCallback((customers: CustomerWithDetails[], days: number): CustomerAnalytics => {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const filteredCustomers = customers.filter(customer => 
      new Date(customer.created_at) >= cutoffDate
    )

    const totalCustomers = customers.length
    const newCustomersThisMonth = filteredCustomers.length
    const activeCustomers = customers.filter(c => c.last_visit && new Date(c.last_visit) >= cutoffDate).length
    const customersWithRatings = customers.filter(c => c.average_rating)
    const averageRating = customersWithRatings.length > 0 
      ? customersWithRatings.reduce((sum, c) => sum + (c.average_rating || 0), 0) / customersWithRatings.length
      : 0
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
    const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const repeatCustomers = customers.filter(c => (c.total_visits || 0) > 1).length
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
    const topCustomers = [...customers]
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 5)

    return {
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      averageRating,
      totalRevenue,
      averageOrderValue,
      customerRetentionRate,
      topCustomers,
      customerSegments: calculateCustomerSegments(customers),
      monthlyGrowth: calculateMonthlyGrowth(customers)
    }
  }, [calculateCustomerSegments, calculateMonthlyGrowth])

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const customers = await fetchCustomersWithDetails({ page: 1, limit: 1000 })
      const analyticsData = calculateCustomerAnalytics(customers.data, parseInt(timeRange))
      setAnalytics(analyticsData)
    } catch (error) {
      handleComponentError(error, 'load customer analytics')
    } finally {
      setLoading(false)
    }
  }, [timeRange, calculateCustomerAnalytics])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="h-6 w-6 animate-spin mr-2">⟳</span>
        Loading analytics...
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your customer base</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <span className="text-sm text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.newCustomersThisMonth} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <span className="text-sm text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.activeCustomers / analytics.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <span className="text-sm text-muted-foreground">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Based on customer feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-sm text-muted-foreground">€</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(analytics.averageOrderValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="growth">Monthly Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.customerSegments.map((segment) => (
                  <div key={segment.segment} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{segment.segment}</Badge>
                      <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={segment.percentage} className="w-24" />
                      <span className="text-sm font-medium">{segment.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(customer.total_spent || 0)}</p>
                      <p className="text-sm text-muted-foreground">{customer.total_visits || 0} visits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyGrowth.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-muted-foreground">{month.customers} new customers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(month.revenue)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 