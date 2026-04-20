'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { submitFeedback } from '@/lib/feedback'
import { FeedbackFormData } from '@/types/customer'
import { toast } from 'sonner'
import { BUSINESS_INFO } from '@/lib/constants'
import { handleComponentError } from '@/utils/error-handling'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId?: string
  eventId?: string
  title?: string
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  eventId,
  title = 'Rate your experience'
}) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [googleReviewPrompted, setGoogleReviewPrompted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const feedbackData: FeedbackFormData = {
        rating,
        comment: comment.trim() || undefined,
        google_review_prompted: googleReviewPrompted,
        booking_id: bookingId,
        event_id: eventId
      }

      await submitFeedback(feedbackData)
      
      toast.success('Thank you for your feedback!')
      
      // If user requested Google review, show it after a short delay
      if (googleReviewPrompted) {
        setTimeout(() => {
          handleGoogleReview()
        }, 1000)
      }
      
      handleClose()
    } catch (error) {
      handleComponentError(error, 'submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setComment('')
    setGoogleReviewPrompted(false)
    onClose()
  }

  const handleGoogleReview = () => {
    // Open Google Review with business-specific URL
    const reviewUrl = BUSINESS_INFO.googleReviewUrl
    window.open(reviewUrl, '_blank')
    
    // Track that user clicked Google review
    toast.success('Thank you for leaving a Google review!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">How would you rate your experience?</Label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors hover:scale-110"
                >
                  <span
                    className={`text-2xl ${
                      star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">
              {rating === 0 && 'Click a star to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional comments (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Google Review Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="google-review"
              checked={googleReviewPrompted}
              onCheckedChange={(checked) => setGoogleReviewPrompted(checked as boolean)}
            />
            <Label htmlFor="google-review" className="text-sm">
              I&apos;d like to leave a public Google review
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            
            {googleReviewPrompted && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleReview}
                className="w-full"
              >
                <span className="mr-2">↗</span>
                Leave Google Review
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 