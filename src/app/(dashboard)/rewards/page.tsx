"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Gift, 
  Calendar, 
  Search as SearchIcon,
  Filter,
  BarChart3,
  CheckCircle,
  Shield
} from "lucide-react";
import { 
  RewardWithDetails, 
  RewardCategory, 
  RewardStatus,
  RewardAnalytics
} from "@/types/rewards";
import { getEnhancedRewards, getRewardAnalytics } from "@/lib/enhanced-rewards";
import { EnhancedRewardCard } from "@/components/rewards/EnhancedRewardCard";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  CardGridSkeleton
} from "@/components/ui/loading-states";
import { LoyaltyVoucherScanner } from "@/components/rewards/LoyaltyVoucherScanner";

type StaffMeResponse = {
  role: string;
  linkedStaff: { id: string; position: string } | null;
};

type StaffListRow = {
  id: string;
  name: string;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedStaffId, setLinkedStaffId] = useState<string | null>(null);
  const [adminProxyStaffId, setAdminProxyStaffId] = useState("");
  const [staffPickList, setStaffPickList] = useState<StaffListRow[]>([]);
  const [analytics, setAnalytics] = useState<RewardAnalytics | null>(null);

  const effectiveStaffId = linkedStaffId ?? adminProxyStaffId;
  const staffIdForRedeemBody = linkedStaffId ? undefined : adminProxyStaffId || undefined;
  const canRedeemPunchQr = Boolean(linkedStaffId || adminProxyStaffId);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [meRes, rewardsData, analyticsData] = await Promise.all([
        api.get<StaffMeResponse>("/staff/me"),
        getEnhancedRewards(),
        getRewardAnalytics(),
      ]);

      const me = meRes.data;
      if (me?.linkedStaff?.id) {
        setLinkedStaffId(me.linkedStaff.id);
        setAdminProxyStaffId("");
        setStaffPickList([]);
      } else {
        setLinkedStaffId(null);
        if (me?.role === "admin") {
          const listRes = await api.get<{ staff: StaffListRow[] }>("/staff?status=active");
          const rows = listRes.data?.staff ?? [];
          setStaffPickList(
            rows.map((row) => ({
              id: row.id,
              name: row.name || "Staff",
            }))
          );
        } else {
          setStaffPickList([]);
        }
      }

      setRewards(rewardsData);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading rewards data:', error);
      toast.error('Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        reward.customer.name.toLowerCase().includes(searchLower) ||
        (reward.customer.email && reward.customer.email.toLowerCase().includes(searchLower)) ||
        reward.description.toLowerCase().includes(searchLower) ||
        reward.redemption_code.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryFilter !== "all" && reward.category !== categoryFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && reward.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const rewardDate = new Date(reward.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (rewardDate < today) return false;
          break;
        case "this_week":
          const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (rewardDate < thisWeek) return false;
          break;
        case "this_month":
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (rewardDate < thisMonth) return false;
          break;
        case "expired":
          if (new Date(reward.expires_at) >= now) return false;
          break;
      }
    }

    return true;
  });

  const getCategoryColor = (category: RewardCategory) => {
    switch (category) {
      case RewardCategory.BIRTHDAY: return "bg-pink-100 text-pink-800";
      case RewardCategory.LOYALTY_PUNCH_CARD: return "bg-muted text-foreground";
      case RewardCategory.FREE_COFFEE: return "bg-amber-100 text-amber-800";
      case RewardCategory.FREE_ALCOHOLIC_DRINK: return "bg-red-100 text-red-800";
      case RewardCategory.DISCOUNT: return "bg-green-100 text-green-800";
      case RewardCategory.VIP_ACCESS: return "bg-purple-100 text-purple-800";
      case RewardCategory.REFERRAL: return "bg-indigo-100 text-indigo-800";
      case RewardCategory.MILESTONE: return "bg-yellow-100 text-yellow-800";
      case RewardCategory.CUSTOM: return "bg-muted text-foreground";
      default: return "bg-muted text-foreground";
    }
  };

  const getStatusColor = (status: RewardStatus) => {
    switch (status) {
      case RewardStatus.ACTIVE: return "bg-muted text-foreground";
      case RewardStatus.CLAIMED: return "bg-green-100 text-green-800";
      case RewardStatus.EXPIRED: return "bg-red-100 text-red-800";
      case RewardStatus.CANCELLED: return "bg-muted text-foreground";
      default: return "bg-muted text-foreground";
    }
  };

  const handleRewardClaimed = () => {
    loadData(); // Reload data to show updated rewards
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={4} />
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Rewards</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage customer rewards and track redemptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className="flex-1 sm:flex-none text-sm sm:text-base"
          >
            Table View
          </Button>
          <Button 
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
            className="flex-1 sm:flex-none text-sm sm:text-base"
          >
            Card View
          </Button>
        </div>
      </div>

      {staffPickList.length > 0 && !linkedStaffId ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Who is redeeming at the bar?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your admin login is not linked to a staff row. Pick the staff member who should appear
              on punch-card redemptions (required for QR scan and manual redeem).
            </p>
          </CardHeader>
          <CardContent>
            <Select value={adminProxyStaffId || undefined} onValueChange={setAdminProxyStaffId}>
              <SelectTrigger className="max-w-md border-border">
                <SelectValue placeholder="Select staff member…" />
              </SelectTrigger>
              <SelectContent className="border-border bg-background">
                {staffPickList.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="focus:bg-muted focus:text-foreground">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ) : null}

      <LoyaltyVoucherScanner
        canRedeem={canRedeemPunchQr}
        staffIdForRequestBody={staffIdForRedeemBody}
        onRedeemed={loadData}
      />

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.total_rewards}</div>
              <p className="text-xs text-muted-foreground">
                All time rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claimed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.claimed_rewards}</div>
              <p className="text-xs text-muted-foreground">
                Successfully claimed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claim Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.claim_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Percentage claimed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">${analytics.average_value}</div>
              <p className="text-xs text-muted-foreground">
                Average reward value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="border-border">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Filter className="h-5 w-5 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus-visible:!border-primary focus-visible:!ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-slate-200 focus-visible:!border-primary focus-visible:!ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-background">
                  <SelectItem value="all" className="focus:bg-muted focus:text-foreground">All Categories</SelectItem>
                  <SelectItem value={RewardCategory.BIRTHDAY} className="focus:bg-muted focus:text-foreground">Birthday</SelectItem>
                  <SelectItem value={RewardCategory.LOYALTY_PUNCH_CARD} className="focus:bg-muted focus:text-foreground">Loyalty Punch Card</SelectItem>
                  <SelectItem value={RewardCategory.FREE_COFFEE} className="focus:bg-muted focus:text-foreground">Free Coffee</SelectItem>
                  <SelectItem value={RewardCategory.FREE_ALCOHOLIC_DRINK} className="focus:bg-muted focus:text-foreground">Free Alcoholic Drink</SelectItem>
                  <SelectItem value={RewardCategory.DISCOUNT} className="focus:bg-muted focus:text-foreground">Discount</SelectItem>
                  <SelectItem value={RewardCategory.VIP_ACCESS} className="focus:bg-muted focus:text-foreground">VIP Access</SelectItem>
                  <SelectItem value={RewardCategory.REFERRAL} className="focus:bg-muted focus:text-foreground">Referral</SelectItem>
                  <SelectItem value={RewardCategory.MILESTONE} className="focus:bg-muted focus:text-foreground">Milestone</SelectItem>
                  <SelectItem value={RewardCategory.CUSTOM} className="focus:bg-muted focus:text-foreground">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-200 focus-visible:!border-primary focus-visible:!ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-background">
                  <SelectItem value="all" className="focus:bg-muted focus:text-foreground">All Status</SelectItem>
                  <SelectItem value={RewardStatus.ACTIVE} className="focus:bg-muted focus:text-foreground">Active</SelectItem>
                  <SelectItem value={RewardStatus.CLAIMED} className="focus:bg-muted focus:text-foreground">Claimed</SelectItem>
                  <SelectItem value={RewardStatus.EXPIRED} className="focus:bg-muted focus:text-foreground">Expired</SelectItem>
                  <SelectItem value={RewardStatus.CANCELLED} className="focus:bg-muted focus:text-foreground">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="border-slate-200 focus-visible:!border-primary focus-visible:!ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-background">
                  <SelectItem value="all" className="focus:bg-muted focus:text-foreground">All Time</SelectItem>
                  <SelectItem value="today" className="focus:bg-muted focus:text-foreground">Today</SelectItem>
                  <SelectItem value="this_week" className="focus:bg-muted focus:text-foreground">This Week</SelectItem>
                  <SelectItem value="this_month" className="focus:bg-muted focus:text-foreground">This Month</SelectItem>
                  <SelectItem value="expired" className="focus:bg-muted focus:text-foreground">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Display */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Rewards ({filteredRewards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reward.customer.name}</div>
                          <div className="text-sm text-muted-foreground">{reward.customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(reward.category)}>
                          {reward.category.replace('_', ' ')}
                        </Badge>
                        {reward.requires_age_verification && (
                          <Shield className="w-3 h-3 ml-1 text-amber-600" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {reward.description}
                      </TableCell>
                      <TableCell>${reward.value}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reward.status)}>
                          {reward.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reward.expires_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {reward.status === RewardStatus.ACTIVE && !reward.claimed && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // This would open a claim modal or redirect to claim page
                              toast.info('Use the card view to claim rewards');
                            }}
                          >
                            Claim
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredRewards.map((reward) => (
                <div key={reward.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">{reward.customer.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{reward.customer.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(reward.category)}>
                        {reward.category.replace('_', ' ')}
                      </Badge>
                      {reward.requires_age_verification && (
                        <Shield className="w-3 h-3 text-amber-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">{reward.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">${reward.value}</span>
                      <Badge className={getStatusColor(reward.status)}>
                        {reward.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(new Date(reward.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  {reward.status === RewardStatus.ACTIVE && !reward.claimed && (
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          toast.info('Use the card view to claim rewards');
                        }}
                        className="w-full sm:w-auto"
                      >
                        Claim
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rewards found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRewards.map((reward) => (
            <EnhancedRewardCard
              key={reward.id}
              reward={reward}
              staffId={effectiveStaffId}
              onRewardClaimed={handleRewardClaimed}
            />
          ))}
          
          {filteredRewards.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rewards found matching your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 