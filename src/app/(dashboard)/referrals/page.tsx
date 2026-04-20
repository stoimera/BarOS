'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Filter, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { getAllReferrals } from '@/lib/referrals'
import { Referral } from '@/types/customer'
import { formatDateTimeGB } from '@/utils/dateUtils'
import { toast } from 'sonner'
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states'

export default function ReferralsAdminPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadReferrals()
  }, [])

  const loadReferrals = async () => {
    try {
      const referralsData = await getAllReferrals()
      setReferrals(referralsData)
    } catch (error) {
      console.error('Error loading referrals:', error)
      toast.error('Failed to load referrals')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReferrals = referrals.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'completed' && item.completed_booking) ||
      (filter === 'pending' && !item.completed_booking)
    
    const matchesSearch = !search || 
      item.referred_email.toLowerCase().includes(search.toLowerCase()) ||
      item.referrer_id.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter(r => r.completed_booking).length
  const pendingReferrals = totalReferrals - completedReferrals
  const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeaderSkeleton />
        <StatCardSkeleton count={4} />
        <DataTableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Referral Program
        </h1>
        <Button onClick={loadReferrals} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{completedReferrals}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{pendingReferrals}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or referrer ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Referrals</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Referrals ({filteredReferrals.length})
        </h2>
        
        {filteredReferrals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground">No referrals found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReferrals.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{item.referred_email}</span>
                        {item.completed_booking ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Referred by: {item.referrer_id}</div>
                        {item.referred_user_id && (
                          <div>Referred user: {item.referred_user_id}</div>
                        )}
                        <div>Created: {formatDateTimeGB(new Date(item.created_at))}</div>
                        {item.updated_at && (
                          <div>Updated: {formatDateTimeGB(new Date(item.updated_at))}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 