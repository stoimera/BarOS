import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BookingCardSkeleton,
  DashboardStatsSkeleton,
  PageHeaderSkeleton,
  SecondaryStatsSkeleton,
  SummaryCardSkeleton,
} from "@/components/ui/loading-states"

export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showActions={false} />
      <DashboardStatsSkeleton />
      <SecondaryStatsSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <BookingCardSkeleton count={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <BookingCardSkeleton count={3} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
