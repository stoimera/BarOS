'use client'

import { LoyaltyCard } from "@/components/customers/LoyaltyCard";
import { LoyaltyRewards } from "@/components/customers/LoyaltyRewards";
import { UpcomingBookingsCard } from "@/components/customers/UpcomingBookingsCard";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";
import { LoyaltyTier, RewardType, LoyaltyReward } from "@/types/customer";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserRewards } from "@/lib/enhanced-rewards";
import { RewardWithDetails } from "@/types/rewards";
import { 
  PageHeaderSkeleton,
  SummaryCardSkeleton
} from "@/components/ui/loading-states";

const mockLoyalty = {
  punchCount: 3,
  goal: 10,
  rewarded: false,
  tier: LoyaltyTier.BRONZE,
  totalPoints: 120,
  lifetimeVisits: 15,
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [recentBookingId, setRecentBookingId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastBookings, setShowPastBookings] = useState(false);

  useEffect(() => {
    // Check for recent bookings that might need feedback
    const checkRecentBookings = () => {
      const lastBooking = localStorage.getItem('last_booking_id');
      if (lastBooking) {
        setRecentBookingId(lastBooking);
      }
    };

    checkRecentBookings();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRewards();
    }
  }, [user]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const rewardsData = await getCurrentUserRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const loyaltyRewards: LoyaltyReward[] = rewards.map(reward => ({
    id: reward.id,
    user_id: reward.customer_id,
    tier: LoyaltyTier.BRONZE,
    reward_type: RewardType.FREE_DRINK,
    description: reward.description,
    claimed: reward.claimed,
    claimed_at: reward.claimed_at,
    expires_at: reward.expires_at,
    created_at: reward.created_at
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your loyalty, rewards, and upcoming visits
          </p>
        </div>
        
        {/* Main Grid - Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Loyalty Section */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <LoyaltyCard {...mockLoyalty} />
            </CardContent>
          </Card>
          
          {/* Loyalty Rewards */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <LoyaltyRewards rewards={loyaltyRewards} onRewardClaimed={loadRewards} />
            </CardContent>
          </Card>
          
          {/* Upcoming Bookings */}
          <div className="md:col-span-2 xl:col-span-1">
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showPastBookings}
                  onChange={(e) => setShowPastBookings(e.target.checked)}
                  className="rounded border-border"
                />
                Show past bookings
              </label>
            </div>
            <UpcomingBookingsCard showPastBookings={showPastBookings} />
          </div>
        </div>

        {/* Engagement Features Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Feedback Card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <FeedbackCard />
            </CardContent>
          </Card>
          
          {/* Referral Card */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <ReferralCard />
            </CardContent>
          </Card>
        </div>

        {/* Feedback Prompt - triggered after booking completion */}
        {recentBookingId && (
          <div className="mt-6 sm:mt-8">
            <FeedbackPrompt
              bookingId={recentBookingId}
              title="How was your recent visit?"
              description="We'd love to hear about your experience at our bar!"
              triggerAfterMinutes={60}  
            />
          </div>
        )}
      </div>
    </div>
  );
} 