"use client"

import { useState } from 'react'
import { useMarketing } from '@/hooks/useMarketing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert, StatsSkeleton, TableSkeleton } from '@/components/ui/loading-states'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Play, 
  Trash2,
  Plus,
  Loader2
} from 'lucide-react'
import { formatDateGB } from '@/utils/dateUtils'
import { toast } from 'sonner'

export default function MarketingDashboardPage() {
  const [executing, setExecuting] = useState<string | null>(null)

  // Use React Query hook for marketing
  const {
    campaigns,
    segments,
    analytics,
    isLoading,
    error,
    deleteCampaign,
    executeCampaign,
    isDeleting,
    isExecuting
  } = useMarketing()

  const handleExecuteCampaign = async (campaignId: string) => {
    setExecuting(campaignId)
    try {
      const result = await executeCampaign(campaignId)
      toast.success(result.message || 'Campaign executed successfully')
    } catch {
      toast.error('Failed to execute campaign')
    } finally {
      setExecuting(null)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    
    try {
      await deleteCampaign(campaignId)
      toast.success('Campaign deleted successfully')
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading && (!campaigns || campaigns.length === 0)) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <StatsSkeleton />

        {/* Content Skeleton */}
        <Card className="">
          <CardContent className="p-4">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Marketing Dashboard</h1>
            <p className="text-muted-foreground">Manage campaigns and customer segments</p>
          </div>
        </div>
        
        <ErrorAlert 
          title="Failed to load marketing data"
          message={error.message}
          onRetry={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Marketing Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage campaigns and customer segments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.total_campaigns}</div>
              <p className="text-xs text-muted-foreground">
                active campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.total_sent}</div>
              <p className="text-xs text-muted-foreground">
                total sent
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.average_open_rate}%</div>
              <p className="text-xs text-muted-foreground">
                average open rate
              </p>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.average_click_rate}%</div>
              <p className="text-xs text-muted-foreground">
                average click rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns */}
      <Card className="">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first campaign.</p>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">{campaign.description || 'No description'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {campaign.segment_name || 'All Customers'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateGB(new Date(campaign.created_at))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExecuteCampaign(campaign.id)}
                            disabled={isExecuting && executing === campaign.id}
                          >
                            {isExecuting && executing === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card className="">
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No segments found</h3>
              <p className="text-muted-foreground mb-4">Create customer segments to target your campaigns.</p>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment) => (
                <div key={segment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{segment.name}</h3>
                    <Badge variant="outline">{segment.customer_count} customers</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{segment.description}</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 