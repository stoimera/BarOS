'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCustomerFeedback } from '@/lib/feedback'
import { Feedback } from '@/types/customer'
import { FeedbackModal } from './FeedbackModal'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTimeGB } from '@/utils/dateUtils'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

export const FeedbackCard: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadFeedback = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    try {
      const customerFeedback = await getCustomerFeedback(user.id)
      setFeedback(customerFeedback)
    } catch (error) {
      console.error('Error loading feedback:', error)
      // Don't throw error, just log it and continue
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && !authLoading) {
      void loadFeedback()
    } else if (!authLoading && !user) {
      // User is not authenticated, stop loading
      setIsLoading(false)
    }
  }, [user, authLoading, loadFeedback])

  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length 
    : 0

  const recentFeedback = feedback.slice(0, 3)

  // Show loading state while auth is loading or feedback is loading
  if (authLoading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="truncate">Your Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-10 sm:h-8 sm:w-12" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-3 w-3 sm:h-4 sm:w-4" />
                ))}
              </div>
            </div>
            <Skeleton className="h-5 w-14 sm:h-6 sm:w-16" />
          </div>

          {/* Recent Feedback Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-20 sm:w-24" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Skeleton key={j} className="h-2 w-2 sm:h-3 sm:w-3" />
                    ))}
                  </div>
                  <Skeleton className="h-3 w-16 sm:w-20" />
                </div>
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="truncate">Your Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-muted-foreground">Please sign in to view your feedback.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Your Feedback</span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <span className="text-xs sm:text-sm">Leave Feedback</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold">{averageRating.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= Math.round(averageRating)
                        ? 'text-blue-600'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs sm:text-sm w-fit">{feedback.length} reviews</Badge>
          </div>

          {/* Recent Feedback */}
          {recentFeedback.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Recent Feedback</h4>
              {recentFeedback.map((item) => (
                <div key={item.id} className="border rounded p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xs ${
                            star <= item.rating
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTimeGB(new Date(item.created_at))}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {item.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm sm:text-base text-muted-foreground">No feedback yet</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Share your experience to help us improve!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}