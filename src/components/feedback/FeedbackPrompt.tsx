'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FeedbackModal } from './FeedbackModal'
import { useFeedbackPrompt } from '@/hooks/useFeedbackPrompt'

interface FeedbackPromptProps {
  bookingId?: string
  eventId?: string
  title?: string
  description?: string
  triggerAfterMinutes?: number
}

export const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({
  bookingId,
  eventId,
  title = "How was your experience?",
  description = "We'd love to hear about your recent visit!",
  triggerAfterMinutes
}) => {
  const [showModal, setShowModal] = useState(false)
  const { showPrompt, markFeedbackGiven, dismissPrompt } = useFeedbackPrompt({
    bookingId,
    eventId,
    triggerAfterMinutes
  })

  const handleGiveFeedback = () => {
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    markFeedbackGiven()
  }

  const handleDismiss = () => {
    dismissPrompt()
  }

  if (!showPrompt) return null

  return (
    <>
      {/* Floating Feedback Prompt */}
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
        <Card className="w-80 shadow-lg border-2 border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base text-blue-600">💬</span>
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <span className="text-sm">✕</span>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGiveFeedback}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">⭐</span>
                Rate Experience
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
            
            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <span className="text-xs">⏰</span>
              <span>Takes 30 seconds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showModal}
        onClose={handleModalClose}
        bookingId={bookingId}
        eventId={eventId}
        title="Share Your Experience"
      />
    </>
  )
} 