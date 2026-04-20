"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  Star, 
  Trophy, 
  Crown, 
  Gem,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserRewards } from "@/lib/enhanced-rewards";
import { RewardWithDetails, RewardCategory, RewardStatus } from "@/types/rewards";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states";

export default function CustomerRewardsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState<RewardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadRewards();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const rewardsData = await getCurrentUserRewards();
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const activeRewards = rewards.filter(reward => 
    !reward.claimed && 
    reward.status === RewardStatus.ACTIVE && 
    new Date(reward.expires_at) > new Date()
  );

  const claimedRewards = rewards.filter(reward => reward.claimed);
  const expiredRewards = rewards.filter(reward => 
    !reward.claimed && 
    new Date(reward.expires_at) <= new Date()
  );

  const getRewardIcon = (category: RewardCategory) => {
    switch (category) {
      case RewardCategory.BIRTHDAY: return Gift;
      case RewardCategory.LOYALTY_PUNCH_CARD: return Star;
      case RewardCategory.FREE_COFFEE: return Gift;
      case RewardCategory.FREE_ALCOHOLIC_DRINK: return Trophy;
      case RewardCategory.DISCOUNT: return Crown;
      case RewardCategory.VIP_ACCESS: return Gem;
      case RewardCategory.REFERRAL: return Star;
      case RewardCategory.MILESTONE: return Trophy;
      case RewardCategory.CUSTOM: return Gift;
      default: return Gift;
    }
  };

  const getRewardColor = (category: RewardCategory) => {
    switch (category) {
      case RewardCategory.BIRTHDAY: return "bg-muted text-foreground border-border";
      case RewardCategory.LOYALTY_PUNCH_CARD: return "bg-muted text-foreground border-border";
      case RewardCategory.FREE_COFFEE: return "bg-muted text-foreground border-border";
      case RewardCategory.FREE_ALCOHOLIC_DRINK: return "bg-muted text-foreground border-border";
      case RewardCategory.DISCOUNT: return "bg-muted text-foreground border-border";
      case RewardCategory.VIP_ACCESS: return "bg-muted text-foreground border-border";
      case RewardCategory.REFERRAL: return "bg-muted text-foreground border-border";
      case RewardCategory.MILESTONE: return "bg-muted text-foreground border-border";
      case RewardCategory.CUSTOM: return "bg-muted text-foreground border-border";
      default: return "bg-muted text-foreground border-border";
    }
  };

  const getStatusBadge = (reward: RewardWithDetails) => {
    if (reward.claimed) {
      return <Badge variant="default" className="text-xs">Claimed</Badge>;
    }
    if (new Date(reward.expires_at) <= new Date()) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Active</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <StatCardSkeleton count={3} />
          <CardGridSkeleton count={6} columns={3} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-4 sm:py-8">
        <Card className="w-full max-w-md bg-card mx-4">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Please log in to view your rewards.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Your Rewards
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage your loyalty rewards
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3 mb-6 sm:mb-8">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Active Rewards</CardTitle>
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-foreground">{activeRewards.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to claim
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Claimed</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-foreground">{claimedRewards.length}</div>
              <p className="text-xs text-muted-foreground">
                Successfully redeemed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Value</CardTitle>
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                ${rewards.reduce((sum, reward) => sum + reward.value, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available rewards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="active" className="text-foreground text-xs sm:text-sm">
              Active ({activeRewards.length})
            </TabsTrigger>
            <TabsTrigger value="claimed" className="text-foreground text-xs sm:text-sm">
              Claimed ({claimedRewards.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-foreground text-xs sm:text-sm">
              Expired ({expiredRewards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 sm:mt-6">
            <Card className="bg-card">
              <CardContent className="p-4 sm:p-6">
                {activeRewards.length > 0 ? (
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeRewards.map((reward) => {
                      const Icon = getRewardIcon(reward.category);
                      return (
                        <div key={reward.id} className="border rounded-lg p-3 sm:p-4 bg-card">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <Badge className={`${getRewardColor(reward.category)} text-xs`}>
                              {reward.category.replace('_', ' ')}
                            </Badge>
                            {getStatusBadge(reward)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">{reward.description}</h3>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                            <span className="truncate">Expires: {format(new Date(reward.expires_at), 'MMM d, yyyy')}</span>
                            <span className="font-medium">${reward.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Gift className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">No Active Rewards</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Keep visiting to earn more rewards!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claimed" className="mt-4 sm:mt-6">
            <Card className="bg-card">
              <CardContent className="p-4 sm:p-6">
                {claimedRewards.length > 0 ? (
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {claimedRewards.map((reward) => {
                      const Icon = getRewardIcon(reward.category);
                      return (
                        <div key={reward.id} className="border rounded-lg p-3 sm:p-4 bg-card">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <Badge className={`${getRewardColor(reward.category)} text-xs`}>
                              {reward.category.replace('_', ' ')}
                            </Badge>
                            {getStatusBadge(reward)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">{reward.description}</h3>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                            <span className="truncate">Claimed: {format(new Date(reward.claimed_at!), 'MMM d, yyyy')}</span>
                            <span className="font-medium">${reward.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">No Claimed Rewards</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Start claiming your rewards!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expired" className="mt-4 sm:mt-6">
            <Card className="bg-card">
              <CardContent className="p-4 sm:p-6">
                {expiredRewards.length > 0 ? (
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {expiredRewards.map((reward) => {
                      const Icon = getRewardIcon(reward.category);
                      return (
                        <div key={reward.id} className="border rounded-lg p-3 sm:p-4 bg-card opacity-60">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <Badge className={`${getRewardColor(reward.category)} text-xs`}>
                              {reward.category.replace('_', ' ')}
                            </Badge>
                            {getStatusBadge(reward)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                            <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">{reward.description}</h3>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                            <span className="truncate">Expired: {format(new Date(reward.expires_at), 'MMM d, yyyy')}</span>
                            <span className="font-medium">${reward.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">No Expired Rewards</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Great job claiming your rewards on time!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 