"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoyaltyReward, RewardType, LoyaltyTier } from "@/types/customer"
import { redeemReward } from "@/lib/enhanced-rewards"
import { toast } from "sonner"
import { formatDateGB } from '@/utils/dateUtils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LoyaltyRewardsProps {
  rewards: LoyaltyReward[]
  onRewardClaimed?: () => void
  className?: string
}

const rewardTypeIcons = {
  [RewardType.FREE_DRINK]: '🎁',
  [RewardType.DISCOUNT]: '⭐',
  [RewardType.PRIORITY_BOOKING]: '👑',
  [RewardType.VIP_EVENT_ACCESS]: '🏆',
  [RewardType.BIRTHDAY_REWARD]: '🎁',
  [RewardType.CUSTOM]: '⭐',
}

const tierIcons = {
  [LoyaltyTier.BRONZE]: '⭐',
  [LoyaltyTier.SILVER]: '🏆',
  [LoyaltyTier.GOLD]: '👑',
  [LoyaltyTier.PLATINUM]: '💎',
}

// Generate a unique voucher code
const generateVoucherCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function LoyaltyRewards({ rewards, onRewardClaimed, className }: LoyaltyRewardsProps) {
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  const [showVoucher, setShowVoucher] = useState(false)
  const [voucherData, setVoucherData] = useState<{
    code: string;
    reward: LoyaltyReward;
    expiresAt: Date;
  } | null>(null)

  const handleClaimReward = async (rewardId: string) => {
    try {
      setClaimingReward(rewardId)
      
      // Use enhanced rewards claiming instead of loyalty rewards
      const { data: { user } } = await import('@/utils/supabase/client').then(m => m.createClient().auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get staff member for claiming (or use a default staff ID for customer self-claiming)
      const staffId = user.id; // For now, use user ID as staff ID for customer self-claiming
      
      const redeemedReward = await redeemReward({
        reward_id: rewardId,
        staff_id: staffId,
        customer_age_verified: false,
        notes: 'Claimed by customer via dashboard'
      });
      
      // Generate voucher data using the reward details
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        const voucherCode = redeemedReward.redemption_code || generateVoucherCode();
        const expiresAt = reward.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
        
        setVoucherData({
          code: voucherCode,
          reward,
          expiresAt: new Date(expiresAt)
        });
        setShowVoucher(true);
      }
      
      toast.success("Reward claimed successfully! Your voucher is ready.")
      onRewardClaimed?.()
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error("Failed to claim reward", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setClaimingReward(null)
    }
  }

  const copyVoucherCode = async () => {
    if (!voucherData) return;
    
    try {
      await navigator.clipboard.writeText(voucherData.code);
      toast.success("Voucher code copied to clipboard!");
    } catch {
      toast.error("Failed to copy voucher code");
    }
  };

  const activeRewards = rewards.filter(reward => !reward.claimed && (!reward.expires_at || new Date(reward.expires_at) > new Date()))
  const claimedRewards = rewards.filter(reward => reward.claimed)
  const expiredRewards = rewards.filter(reward => !reward.claimed && reward.expires_at && new Date(reward.expires_at) <= new Date())

  if (rewards.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="text-base sm:text-lg">🎁</span>
            <span className="truncate">Loyalty Rewards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <span className="text-4xl sm:text-5xl mx-auto mb-4 opacity-50 block">🎁</span>
            <p className="text-sm sm:text-base">No rewards yet. Keep visiting to earn rewards!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Active Rewards */}
      {activeRewards.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="text-base sm:text-lg text-foreground">🎁</span>
              <span className="truncate">Available Rewards ({activeRewards.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeRewards.map((reward) => {
              const rewardIcon = rewardTypeIcons[reward.reward_type] || '🎁'
              const tierIcon = tierIcons[reward.tier] || '⭐'
              
              return (
                <div key={reward.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg border-border gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-base sm:text-lg text-primary">{rewardIcon}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{tierIcon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{reward.description}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {reward.expires_at && (
                          <span className="flex items-center gap-1">
                            <span className="text-xs">⏰</span>
                            <span className="truncate">Expires {formatDateGB(reward.expires_at)}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={claimingReward === reward.id}
                    className="flex-shrink-0 w-full sm:w-auto"
                  >
                    {claimingReward === reward.id ? (
                      "Claiming..."
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm mr-1">✓</span>
                        <span className="text-xs sm:text-sm">Claim</span>
                      </>
                    )}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs sm:text-sm text-gray-400 cursor-help">ℹ</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Claiming a reward generates a unique voucher code. Show this code to staff at Urban Bar to redeem your reward. Vouchers can only be used once and expire on the date shown.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Claimed Rewards */}
      {claimedRewards.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="text-base sm:text-lg text-foreground">✓</span>
              <span className="truncate">Claimed Rewards ({claimedRewards.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {claimedRewards.slice(0, 5).map((reward) => {
              const rewardIcon = rewardTypeIcons[reward.reward_type] || '🎁'
              const tierIcon = tierIcons[reward.tier] || '⭐'
                
                return (
                  <div key={reward.id} className="flex items-center gap-3 p-2 bg-white dark:bg-[#101c36] rounded">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm text-foreground">{rewardIcon}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{tierIcon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{reward.description}</p>
                      {reward.claimed_at && (
                        <p className="text-xs text-muted-foreground">
                          Claimed {formatDateGB(reward.claimed_at)}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Claimed
                    </Badge>
                  </div>
                )
              })}
              {claimedRewards.length > 5 && (
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  +{claimedRewards.length - 5} more claimed rewards
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Rewards */}
      {expiredRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="text-base sm:text-lg text-muted-foreground">⏰</span>
              <span className="truncate">Expired Rewards ({expiredRewards.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredRewards.slice(0, 3).map((reward) => {
              const rewardIcon = rewardTypeIcons[reward.reward_type] || '🎁'
              const tierIcon = tierIcons[reward.tier] || '⭐'
                
                return (
                  <div key={reward.id} className="flex items-center gap-3 p-2 bg-white dark:bg-[#101c36] rounded opacity-60">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm text-muted-foreground">{rewardIcon}</span>
                      <span className="text-xs sm:text-sm text-gray-400">{tierIcon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm truncate">{reward.description}</p>
                      {reward.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expired {formatDateGB(reward.expires_at)}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Expired
                    </Badge>
                  </div>
                )
              })}
              {expiredRewards.length > 3 && (
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  +{expiredRewards.length - 3} more expired rewards
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voucher Modal */}
      <Dialog open={showVoucher} onOpenChange={setShowVoucher}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl text-foreground">🎁</span>
              Your Voucher is Ready!
            </DialogTitle>
          </DialogHeader>
          
          {voucherData && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                    {voucherData.code}
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Show this code to staff when redeeming
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">🎁</span>
                    <span className="font-medium">{voucherData.reward.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary">⏰</span>
                    <span>Valid until {formatDateGB(voucherData.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary">✓</span>
                    <span className="text-blue-700">Status: Ready to use</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted border border-border rounded-lg p-3">
                <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span className="text-sm">ℹ</span>
                  How to use your voucher:
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Visit Urban Bar during business hours</li>
                  <li>• Show this code to any staff member</li>
                  <li>• Staff will verify and redeem your reward</li>
                  <li>• Voucher will be marked as used automatically</li>
                  <li>• One-time use only - cannot be reused</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={copyVoucherCode}
                  className="flex-1"
                  variant="outline"
                >
                  <span className="mr-2">📋</span>
                  Copy Code
                </Button>
                <Button 
                  onClick={() => setShowVoucher(false)}
                  className="flex-1"
                >
                  Got it!
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                <p>This voucher will disappear from your account once used</p>
                <p>Keep this code safe - it cannot be regenerated</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 