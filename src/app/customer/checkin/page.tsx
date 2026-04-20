"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Gift,
  MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserVisits } from "@/lib/visits";
import { getCurrentUserRewards } from "@/lib/enhanced-rewards";
import { VisitWithDetails } from "@/types/visit";
import { RewardWithDetails } from "@/types/rewards";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton,
  ListItemSkeleton
} from "@/components/ui/loading-states";

export default function CustomerCheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [rewards, setRewards] = useState<RewardWithDetails[]>([]);
  const [visitStats, setVisitStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadCustomerData();
    }
  }, [user, authLoading]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // Load customer data in parallel
      const [visitsData, rewardsData] = await Promise.all([
        getCurrentUserVisits(),
        getCurrentUserRewards()
      ]);

      setVisits(visitsData);
      setRewards(rewardsData);

      // Calculate visit stats
      if (visitsData.length > 0) {
        const stats = {
          totalVisits: visitsData.length,
          thisMonth: visitsData.filter(v => {
            const visitDate = new Date(v.visit_date);
            const thisMonth = new Date();
            return visitDate.getMonth() === thisMonth.getMonth() && 
                   visitDate.getFullYear() === thisMonth.getFullYear();
          }).length,
          lastVisit: visitsData[0]?.visit_date ? new Date(visitsData[0].visit_date) : null
        };
        setVisitStats(stats);
      }

    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setCheckingIn(true);
    try {
      // This would typically call an API to check in the customer
      // For now, we'll simulate the check-in process
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Successfully checked in! Welcome back!');
      
      // Reload data to show new visit
      await loadCustomerData();
      
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const activeRewards = rewards.filter(reward => 
    !reward.claimed && 
    reward.status === 'active' && 
    new Date(reward.expires_at) > new Date()
  );

  const recentVisits = visits.slice(0, 5);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <StatCardSkeleton count={3} />
          <CardGridSkeleton count={2} columns={2} />
          <ListItemSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center py-4 sm:py-8">
        <Card className="w-full max-w-md bg-card mx-4">
          <CardContent className="p-4 sm:p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Please log in to access the check-in page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome Back!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Check in to earn points and track your visits
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Check-in Card */}
          <Card className="md:col-span-2 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg dark:text-white">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                Check In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="border border-border rounded p-4 sm:p-6">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    Ready to check in?
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Let us know you&apos;re here and earn loyalty points!
                  </p>
                  <Button 
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    size="lg"
                    className="w-full md:w-auto text-sm sm:text-base"
                  >
                    {checkingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit Stats */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg dark:text-white">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                Your Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {visitStats ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground">Total Visits</span>
                    <span className="font-semibold text-base sm:text-lg dark:text-white">{visitStats.totalVisits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground">This Month</span>
                    <span className="font-semibold text-sm sm:text-base dark:text-white">{visitStats.thisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground">Last Visit</span>
                    <span className="font-semibold text-sm sm:text-base dark:text-white">
                      {visitStats.lastVisit ? 
                        format(visitStats.lastVisit, 'MMM d') : 
                        'Never'
                      }
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">
                  No visit history yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Rewards */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg dark:text-white">
                <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                Your Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRewards.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {activeRewards.slice(0, 3).map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm dark:text-white truncate">{reward.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {format(new Date(reward.expires_at), 'MMM d')}
                        </p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs ml-2 flex-shrink-0">
                        ${reward.value}
                      </Badge>
                    </div>
                  ))}
                  {activeRewards.length > 3 && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      +{activeRewards.length - 3} more rewards
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">
                  No active rewards
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Visits */}
          <Card className="md:col-span-2 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg dark:text-white">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                Recent Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentVisits.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm dark:text-white truncate">
                            {format(new Date(visit.visit_date), 'EEEE, MMMM d')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {visit.visit_type} visit
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-muted text-foreground text-xs ml-2 flex-shrink-0">
                        {visit.check_in_time ? 
                          format(new Date(visit.check_in_time), 'HH:mm') : 
                          'Checked In'
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">
                  No recent visits
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 