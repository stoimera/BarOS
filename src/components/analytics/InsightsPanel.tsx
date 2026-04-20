import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIInsight, generateAIInsights } from "@/lib/ai-insights"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Brain } from "lucide-react"

interface InsightsPanelProps {
  className?: string
}


const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-muted text-foreground border-border',
  medium: 'bg-muted text-foreground border-border',
  low: 'bg-muted text-foreground border-border',
}

export function InsightsPanel({ className }: InsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [filteredInsights, setFilteredInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const data = await generateAIInsights()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
      toast.error('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const filterInsights = useCallback(() => {
    let filtered = insights

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === selectedCategory)
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(insight => insight.impact === selectedPriority)
    }

    setFilteredInsights(filtered)
  }, [insights, selectedCategory, selectedPriority])

  useEffect(() => {
    filterInsights()
  }, [filterInsights])

  const handleAction = (insight: AIInsight) => {
    // This would typically trigger the suggested action
    toast.success(`Action triggered: ${insight.recommendations[0]}`)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'customer_retention':
        return '👥'
      case 'inventory_optimization':
        return '📦'
      case 'event_performance':
        return '📅'
      case 'revenue_opportunity':
        return '💰'
      case 'loyalty_engagement':
        return '🎁'
      default:
        return '💡'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalInsights = insights.filter(i => i.impact === 'critical').length
  const highInsights = insights.filter(i => i.impact === 'high').length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            AI Insights
            {criticalInsights > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalInsights} Critical
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadInsights}>
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
                              {['customer', 'revenue', 'operations', 'marketing', 'staff'].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No insights available for the selected filters.</p>
            <p className="text-sm">Try adjusting your filters or refresh the data.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => {
              
              return (
                <div
                  key={insight.id}
                  className={`p-4 border rounded ${insight.impact === 'critical' ? 'border-destructive/20 bg-destructive/10' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getInsightIcon(insight.type)}</span>
                      <h4 className="font-medium">{insight.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={priorityColors[insight.impact]}
                      >
                        {insight.impact}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  
                  {insight.recommendations.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Recommendations:</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(insight)}
                      >
                        View Recommendations
                      </Button>
                    </div>
                  )}
                  
                  {insight.data_points && Object.keys(insight.data_points).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(insight.data_points, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {insights.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredInsights.length} of {insights.length} insights
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {criticalInsights} Critical
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {highInsights} High
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 