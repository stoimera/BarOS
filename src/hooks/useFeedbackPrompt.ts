import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { FEEDBACK_CONFIG } from '@/lib/constants'

interface UseFeedbackPromptProps {
  bookingId?: string
  eventId?: string
  triggerAfterMinutes?: number
}

export const useFeedbackPrompt = ({ 
  bookingId, 
  eventId, 
  triggerAfterMinutes = FEEDBACK_CONFIG.promptDelayMinutes 
}: UseFeedbackPromptProps) => {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [hasShownPrompt, setHasShownPrompt] = useState(false)

  useEffect(() => {
    if (!user || !bookingId || hasShownPrompt) return

    // Check if we should show feedback prompt
    const shouldShowPrompt = () => {
      // Check if user has already given feedback for this booking/event
      const feedbackKey = `feedback_${bookingId || eventId}`
      const hasGivenFeedback = localStorage.getItem(feedbackKey)
      
      if (hasGivenFeedback) {
        setHasShownPrompt(true)
        return false
      }

      // Check if enough time has passed since booking/event
      const bookingTime = localStorage.getItem(`booking_time_${bookingId}`)
      if (bookingTime) {
        const timeDiff = Date.now() - parseInt(bookingTime)
        const minutesDiff = timeDiff / (1000 * 60)
        
        if (minutesDiff >= triggerAfterMinutes) {
          return true
        }
      }

      return false
    }

    // Set up timer to check for feedback prompt
    const timer = setInterval(() => {
      if (shouldShowPrompt()) {
        setShowPrompt(true)
        setHasShownPrompt(true)
        clearInterval(timer)
      }
    }, 60000) // Check every minute

    return () => clearInterval(timer)
  }, [user, bookingId, eventId, triggerAfterMinutes, hasShownPrompt])

  const markFeedbackGiven = () => {
    const feedbackKey = `feedback_${bookingId || eventId}`
    localStorage.setItem(feedbackKey, 'true')
    setShowPrompt(false)
    setHasShownPrompt(true)
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    setHasShownPrompt(true)
  }

  const setBookingTime = (bookingId: string) => {
    localStorage.setItem(`booking_time_${bookingId}`, Date.now().toString())
  }

  return {
    showPrompt,
    markFeedbackGiven,
    dismissPrompt,
    setBookingTime
  }
} 