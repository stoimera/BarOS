import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoyaltyTier } from "@/types/customer"
import { getTierConfig } from "@/lib/customers"
import { cn } from "@/lib/utils"

interface LoyaltyTierCardProps {
  tier: LoyaltyTier
  totalPoints: number
  lifetimeVisits: number
  className?: string
}

const tierIcons = {
  [LoyaltyTier.BRONZE]: '⭐',
  [LoyaltyTier.SILVER]: '🏆',
  [LoyaltyTier.GOLD]: '👑',
  [LoyaltyTier.PLATINUM]: '💎',
}

export function LoyaltyTierCard({ 
  tier, 
  totalPoints, 
  lifetimeVisits,
  className 
}: LoyaltyTierCardProps) {
  const tierConfig = getTierConfig(tier)
  const tierIcon = tierIcons[tier]

  return (
    <Card className={cn("border-2", className)} style={{ borderColor: tierConfig.color }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-xl" style={{ color: tierConfig.color }}>{tierIcon}</span>
          {tierConfig.name} Member
          <span className="text-2xl">{tierConfig.icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Points</p>
            <p className="font-bold text-lg">{totalPoints}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lifetime Visits</p>
            <p className="font-bold text-lg">{lifetimeVisits}</p>
          </div>
        </div>
        
        <div>
          <p className="text-muted-foreground text-sm mb-2">Available Rewards</p>
          <div className="flex flex-wrap gap-1">
            {tierConfig.rewards.slice(0, 3).map((reward, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {reward}
              </Badge>
            ))}
            {tierConfig.rewards.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tierConfig.rewards.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 