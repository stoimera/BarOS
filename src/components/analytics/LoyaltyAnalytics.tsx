import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
// These functions don't exist yet, so we'll implement them inline
import { Skeleton } from "@/components/ui/skeleton"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts'

const supabase = createClient()

interface LoyaltyStats {
  totalMembers: number
  activeMembers: number
  totalRewards: number
  claimedRewards: number
  tierDistribution: {
    tier: string
    count: number
    percentage: number
  }[]
  monthlySignups: {
    month: string
    count: number
  }[]
  averageVisits: number
  topEarners: {
    name: string
    visits: number
    tier: string
  }[]
}

const COLORS = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2']

const getLoyaltyTierConfig = (tier: string) => {
  const configs = {
    bronze: { name: 'Bronze', color: '#cd7f32' },
    silver: { name: 'Silver', color: '#c0c0c0' },
    gold: { name: 'Gold', color: '#ffd700' },
    platinum: { name: 'Platinum', color: '#e5e4e2' }
  }
  return configs[tier as keyof typeof configs] || configs.bronze
}

export function LoyaltyAnalytics() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoyaltyStats()
  }, [])

  const loadLoyaltyStats = async () => {
    try {
      setLoading(true)
      
      // Fetch loyalty data
      const { data: loyaltyData } = await supabase
        .from('loyalty')
        .select(`
          *,
          profiles!inner(name)
        `)
      
      if (!loyaltyData) return

      // Calculate tier distribution
      const tierCounts = loyaltyData.reduce((acc: any, member: any) => {
        const tier = member.tier || 'bronze'
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      }, {})

      const totalMembers = loyaltyData.length
      const tierDistribution = Object.entries(tierCounts).map(([tier, count]) => ({
        tier,
        count: count as number,
        percentage: totalMembers > 0 ? Math.round(((count as number) / totalMembers) * 100) : 0
      }))

      // Calculate monthly signups (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const monthlySignups = loyaltyData
        .filter((member: any) => new Date(member.created_at) >= sixMonthsAgo)
        .reduce((acc: any, member: any) => {
          const month = new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {})

      const monthlySignupsData = Object.entries(monthlySignups).map(([month, count]) => ({
        month,
        count: count as number
      }))

      // Calculate top earners
      const topEarners = loyaltyData
        .sort((a: any, b: any) => (b.lifetime_visits || 0) - (a.lifetime_visits || 0))
        .slice(0, 5)
        .map((member: any) => ({
          name: member.profiles?.name || 'Unknown',
          visits: member.lifetime_visits || 0,
          tier: getLoyaltyTierConfig(member.tier || 'bronze').name
        }))

      // Fetch rewards data
      const { data: rewardsData } = await supabase
        .from('loyalty_rewards')
        .select('*')

      const totalRewards = rewardsData?.length || 0
      const claimedRewards = rewardsData?.filter((r: any) => r.claimed).length || 0

      // Calculate average visits
      const totalVisits = loyaltyData.reduce((sum: number, member: any) => sum + (member.lifetime_visits || 0), 0)
      const averageVisits = totalMembers > 0 ? Math.round(totalVisits / totalMembers) : 0

      // Calculate active members (visited in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const activeMembers = loyaltyData.filter((member: any) => 
        member.last_visit && new Date(member.last_visit) >= thirtyDaysAgo
      ).length

      setStats({
        totalMembers,
        activeMembers,
        totalRewards,
        claimedRewards,
        tierDistribution,
        monthlySignups: monthlySignupsData,
        averageVisits,
        topEarners
      })
    } catch (error) {
      console.error('Failed to load loyalty stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <span className="text-5xl mx-auto mb-4 opacity-50 block">🎁</span>
        <p>No loyalty data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <span className="text-sm text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMembers} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <span className="text-sm text-muted-foreground">🎁</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRewards}</div>
            <p className="text-xs text-muted-foreground">
              {stats.claimedRewards} claimed ({stats.totalRewards > 0 ? Math.round((stats.claimedRewards / stats.totalRewards) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visits</CardTitle>
            <span className="text-sm text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageVisits}</div>
            <p className="text-xs text-muted-foreground">
              per member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <span className="text-sm text-muted-foreground">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              active rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Member Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${String(name ?? "")} ${((percent ?? 0) * 100).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Signups */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Earners */}
      <Card>
        <CardHeader>
          <CardTitle>Top Members by Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topEarners.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.tier} member</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{member.visits} visits</p>
                  <p className="text-xs text-muted-foreground">Lifetime</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 