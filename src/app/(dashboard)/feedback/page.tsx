'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, MessageSquare, Filter, ExternalLink } from 'lucide-react'
import { getAllFeedback, getFeedbackStats } from '@/lib/feedback'
import { Feedback } from '@/types/customer'
import { formatDateTimeGB } from '@/utils/dateUtils'
import { toast } from 'sonner'
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  ListItemSkeleton
} from '@/components/ui/loading-states'

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadFeedback()
  }, [])

  const loadFeedback = async () => {
    try {
      const [feedbackData, statsData] = await Promise.all([
        getAllFeedback(),
        getFeedbackStats()
      ])
      setFeedback(feedbackData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading feedback:', error)
      toast.error('Failed to load feedback')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFeedback = feedback.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'high' && item.rating >= 4) ||
      (filter === 'low' && item.rating <= 2) ||
      (filter === 'google' && item.google_review_prompted)
    
    const matchesSearch = !search || 
      item.comment?.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const averageRating = (stats?.average as number) || 0
  const totalReviews = (stats?.total as number) || 0

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={3} />
        <ListItemSkeleton count={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Reviews
        </h1>
        <Button onClick={loadFeedback} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{averageRating}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Google Review Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback.filter(f => f.google_review_prompted).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search comments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="high">High Rating (4-5)</SelectItem>
                <SelectItem value="low">Low Rating (1-2)</SelectItem>
                <SelectItem value="google">Google Review Requests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Reviews ({filteredFeedback.length})
        </h2>
        
        {filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground">No feedback found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= item.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary">
                          {item.rating}/5
                        </Badge>
                        {item.google_review_prompted && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Google Review
                          </Badge>
                        )}
                      </div>
                      
                      {item.comment && (
                        <p className="text-foreground mb-2">{item.comment}</p>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        <span>Customer ID: {item.customer_id}</span>
                        {item.booking_id && (
                          <span className="ml-4">Booking: {item.booking_id}</span>
                        )}
                        {item.event_id && (
                          <span className="ml-4">Event: {item.event_id}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDateTimeGB(item.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 