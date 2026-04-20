'use client'

import { useState, useEffect } from 'react'
import { CustomerAnalytics } from '@/components/analytics/CustomerAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Brain,
  Target,
  AlertTriangle,
  Lightbulb,
  Download,
  Calendar,
  Clock,
  Gift,
  Activity
} from 'lucide-react'
import { 
  getComprehensiveAnalytics,
  exportAnalyticsToCSV
} from '@/lib/advanced-analytics'
import { 
  generateAIInsights,
  generatePredictiveInsights,
  AIInsight,
  PredictiveInsight
} from '@/lib/ai-insights'
import { toast } from 'sonner'
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  CardGridSkeleton
} from '@/components/ui/loading-states'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError("")

      const [analyticsResult, insightsResult, predictiveResult] = await Promise.allSettled([
        getComprehensiveAnalytics(),
        generateAIInsights(),
        generatePredictiveInsights(),
      ])

      if (analyticsResult.status === "rejected") {
        throw analyticsResult.reason
      }

      setAnalytics(analyticsResult.value)
      setAiInsights(insightsResult.status === "fulfilled" ? insightsResult.value : [])
      setPredictiveInsights(predictiveResult.status === "fulfilled" ? predictiveResult.value : [])

      if (insightsResult.status === "rejected") {
        toast.error("AI insights are temporarily unavailable")
      }

      if (predictiveResult.status === "rejected") {
        toast.error("Predictive insights are temporarily unavailable")
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load analytics"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'customer' | 'visits' | 'rewards' | 'staff' | 'comprehensive') => {
    try {
      await exportAnalyticsToCSV(type)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />
      case 'opportunity': return <Lightbulb className="h-4 w-4" />
      case 'risk': return <AlertTriangle className="h-4 w-4" />
      case 'recommendation': return <Target className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return 'bg-muted text-foreground'
      case 'anomaly': return 'bg-orange-100 text-orange-800'
      case 'opportunity': return 'bg-green-100 text-green-800'
      case 'risk': return 'bg-red-100 text-red-800'
      case 'recommendation': return 'bg-purple-100 text-purple-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
        <CardGridSkeleton count={4} columns={2} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your business performance
            </p>
          </div>
          <Button onClick={loadAllData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p>No analytics data available</p>
      </div>
    )
  }

  const { customer, visits, rewards, staff, business } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance with AI-powered recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              +{customer.new_customers_this_month} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visits.total_visits}</div>
            <p className="text-xs text-muted-foreground">
              {visits.visits_this_month} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Issued</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.total_rewards_issued}</div>
            <p className="text-xs text-muted-foreground">
              {rewards.redemption_rate}% redemption rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.staff_utilization}%</div>
            <p className="text-xs text-muted-foreground">
              {staff.active_staff} active staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      {aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {aiInsights.slice(0, 6).map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <Badge className={`text-xs ${getInsightColor(insight.type)}`}>
                        {insight.type}
                      </Badge>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getImpactColor(insight.impact)}`} />
                  </div>
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Confidence: {insight.confidence}%
                  </div>
                  {insight.recommendations.length > 0 && (
                    <div className="text-xs">
                      <strong>Recommendations:</strong>
                      <ul className="mt-1 space-y-1">
                        {insight.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>VIP Customers</span>
                    <Badge variant="secondary">{customer.customer_segments.vip}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Regular Customers</span>
                    <Badge variant="secondary">{customer.customer_segments.regular}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Occasional Customers</span>
                    <Badge variant="secondary">{customer.customer_segments.occasional}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Inactive Customers</span>
                    <Badge variant="secondary">{customer.customer_segments.inactive}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Business Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Customer Satisfaction</span>
                    <Badge variant="outline">{business.customer_satisfaction_score}/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Repeat Visit Rate</span>
                    <Badge variant="outline">{business.repeat_visit_rate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Churn Rate</span>
                    <Badge variant="outline">{business.churn_rate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Growth Rate</span>
                    <Badge variant="outline">{customer.customer_growth_rate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visit Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Regular Visits</span>
                    <Badge variant="secondary">{visits.visit_types.regular}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Event Visits</span>
                    <Badge variant="secondary">{visits.visit_types.event}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Special Visits</span>
                    <Badge variant="secondary">{visits.visit_types.special}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Birthday Visits</span>
                    <Badge variant="secondary">{visits.visit_types.birthday}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VIP Visits</span>
                    <Badge variant="secondary">{visits.visit_types.vip}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reward Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Reward Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Redemption Rate</span>
                    <Badge variant="outline">{rewards.redemption_rate}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Value</span>
                    <Badge variant="outline">${rewards.average_reward_value}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Issued</span>
                    <Badge variant="secondary">{rewards.total_rewards_issued}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Redeemed</span>
                    <Badge variant="secondary">{rewards.total_rewards_redeemed}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Customer Analytics</h3>
            <Button onClick={() => handleExport('customer')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <CustomerAnalytics />
        </TabsContent>

        <TabsContent value="visits" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Visit Analytics</h3>
            <Button onClick={() => handleExport('visits')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visit Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Visits</span>
                    <span className="font-bold">{visits.total_visits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>This Month</span>
                    <span className="font-bold">{visits.visits_this_month}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>This Week</span>
                    <span className="font-bold">{visits.visits_this_week}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg per Customer</span>
                    <span className="font-bold">{visits.average_visits_per_customer}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visits.peak_visiting_hours.map((hour: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{hour.hour}:00</span>
                      <Badge variant="outline">{hour.count} visits</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reward Analytics</h3>
            <Button onClick={() => handleExport('rewards')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reward Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Issued</span>
                    <span className="font-bold">{rewards.total_rewards_issued}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Redeemed</span>
                    <span className="font-bold">{rewards.total_rewards_redeemed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Redemption Rate</span>
                    <span className="font-bold">{rewards.redemption_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Value</span>
                    <span className="font-bold">${rewards.average_reward_value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Reward Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rewards.top_reward_types.map((reward: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{reward.type}</span>
                      <Badge variant="outline">{reward.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Analytics</h3>
            <Button onClick={() => handleExport('staff')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Staff Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Staff</span>
                    <span className="font-bold">{staff.total_staff}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Staff</span>
                    <span className="font-bold">{staff.active_staff}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilization Rate</span>
                    <span className="font-bold">{staff.staff_utilization}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.staff_performance
                    .sort((a: any, b: any) => b.efficiency_score - a.efficiency_score)
                    .slice(0, 5)
                    .map((staff: any, index: number) => (
                      <div key={staff.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{index + 1}.</span>
                          <span className="text-sm">{staff.name}</span>
                        </div>
                        <Badge variant="outline">{staff.efficiency_score}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Predictive Analytics</h3>
            <Button onClick={() => handleExport('comprehensive')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {predictiveInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {insight.metric.replace('_', ' ').toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current</span>
                      <span className="font-bold">{insight.current_value}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Predicted</span>
                      <span className="font-bold text-primary">{insight.predicted_value}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {insight.confidence_interval[0]} - {insight.confidence_interval[1]}
                    </div>
                    <div className="text-xs">
                      <strong>Factors:</strong>
                      <ul className="mt-1 space-y-1">
                        {insight.factors.slice(0, 2).map((factor, idx) => (
                          <li key={idx} className="text-muted-foreground">• {factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-xs">
                      <strong>Recommendations:</strong>
                      <ul className="mt-1 space-y-1">
                        {insight.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 