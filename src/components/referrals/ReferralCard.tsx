'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { getReferralStats, createReferral, claimReferralReward, checkReferralRewardEligibility } from '@/lib/referrals'
import { ReferralStats } from '@/types/customer'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

export const ReferralCard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [referredEmail, setReferredEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rewardEligibility, setRewardEligibility] = useState<any>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  const loadReferralStats = useCallback(async () => {
    if (!user) return
    
    try {
      const referralStats = await getReferralStats(user.id)
      setStats(referralStats)
    } catch (error) {
      console.error('Error loading referral stats:', error)
      toast.error('Failed to load referral information')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const checkRewardEligibility = useCallback(async () => {
    if (!user) return
    
    try {
      const eligibility = await checkReferralRewardEligibility(user.id)
      setRewardEligibility(eligibility)
    } catch (error) {
      console.error('Error checking reward eligibility:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void loadReferralStats()
      void checkRewardEligibility()
    }
  }, [user, loadReferralStats, checkRewardEligibility])

  const handleClaimReward = async () => {
    if (!user) return
    
    setIsClaiming(true)
    try {
      await claimReferralReward(user.id)
      toast.success('Reward claimed successfully! Check your loyalty rewards.')
      await loadReferralStats() // Refresh stats
      await checkRewardEligibility() // Refresh eligibility
    } catch (error) {
      console.error('Error claiming reward:', error)
      toast.error('Failed to claim reward. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  const copyReferralCode = async () => {
    if (!stats?.referral_code) return

    try {
      await navigator.clipboard.writeText(stats.referral_code)
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy referral code')
    }
  }

  const shareReferralCode = async () => {
    if (!stats?.referral_code) return

    const shareText = `Join me at [Your Business Name]! Use my referral code: ${stats.referral_code}`
    const shareUrl = `${window.location.origin}/register?ref=${stats.referral_code}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me!',
          text: shareText,
          url: shareUrl
        })
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast.success('Referral link copied!')
      } catch {
        toast.error('Failed to copy referral link')
      }
    }
  }

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!referredEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsSubmitting(true)

    try {
      await createReferral(referredEmail.trim())
      setReferredEmail('')
      await loadReferralStats() // Refresh stats
      toast.success('Referral sent successfully!')
    } catch (error) {
      console.error('Error creating referral:', error)
      toast.error('Failed to send referral')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = stats ? (stats.completed_referrals / 3) * 100 : 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="text-base sm:text-lg">👥</span>
            <span className="truncate">Refer Friends</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code Section Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 sm:w-32" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Progress Section Skeleton */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 sm:w-32" />
              <Skeleton className="h-6 w-20 sm:w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-40 sm:w-48" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 sm:w-40" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16 sm:w-20" />
            </div>
          </div>

          {/* Stats Summary Skeleton */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <Skeleton className="h-6 w-10 sm:h-8 sm:w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 sm:w-24 mx-auto" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-10 sm:h-8 sm:w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 sm:w-20 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">Refer Friends</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="space-y-3">
          <Label className="text-xs sm:text-sm font-medium">Your Referral Code</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={stats?.referral_code || ''}
              readOnly
              className="font-mono text-center text-xs sm:text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={copyReferralCode}
                className="shrink-0 h-10 w-10"
              >
                {copied ? <span className="text-xs sm:text-sm">✓</span> : <span className="text-xs sm:text-sm">📋</span>}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={shareReferralCode}
                className="shrink-0 h-10 w-10"
              >
                <span className="text-xs sm:text-sm">🔗</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium">Progress to Reward</span>
            <Badge variant="secondary" className="text-xs">
              {stats?.completed_referrals || 0} of 3 completed
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {stats?.has_earned_reward 
              ? '🎉 You\'ve earned your reward!'
              : `${stats?.next_reward_at || 0} more successful referrals needed`
            }
          </p>
        </div>

        {/* Quick Referral Form */}
        <form onSubmit={handleSubmitReferral} className="space-y-3">
          <Label htmlFor="referred-email" className="text-xs sm:text-sm font-medium">
            Refer a friend by email
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="referred-email"
              type="email"
              placeholder="friend@example.com"
              value={referredEmail}
              onChange={(e) => setReferredEmail(e.target.value)}
              disabled={isSubmitting}
              className="text-xs sm:text-sm"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !referredEmail.trim()}
              className="shrink-0 h-10"
            >
              <span className="text-xs sm:text-sm">{isSubmitting ? 'Sending...' : 'Send'}</span>
            </Button>
          </div>
        </form>

        {/* Reward Section */}
        {stats?.has_earned_reward && (
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base sm:text-lg text-green-600">🎁</span>
              <span className="font-medium text-green-800 text-sm sm:text-base">Reward Unlocked!</span>
            </div>
            <p className="text-xs sm:text-sm text-green-700 mb-3">
              You&apos;ve successfully referred {stats.completed_referrals} friends! 
              Claim your {rewardEligibility?.rewardDescription || 'reward'}.
            </p>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              onClick={handleClaimReward}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-xs sm:text-sm">Claiming...</span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm mr-2">↗</span>
                  <span className="text-xs sm:text-sm">Claim Reward</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Progress to Reward */}
        {!stats?.has_earned_reward && stats && (
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base sm:text-lg text-blue-600">🎁</span>
              <span className="font-medium text-blue-800 text-sm sm:text-base">Progress to Reward</span>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 mb-2">
              {stats.completed_referrals} of {rewardEligibility?.neededReferrals || 3} referrals completed
            </p>
            <p className="text-xs text-blue-600">
              Reward: {rewardEligibility?.rewardDescription || 'Free drink'}
            </p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {stats?.total_referrals || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats?.completed_referrals || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 