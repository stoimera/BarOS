import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LoyaltyTier } from "@/types/customer"
import { getTierConfig } from "@/lib/customers"
import { CheckCircle, Gift } from "lucide-react"

interface LoyaltyCardProps {
  punchCount: number
  goal: number
  rewarded: boolean
  tier: LoyaltyTier
  totalPoints: number
  lifetimeVisits: number
  onAddVisit?: () => void
  onMarkRewarded?: () => void
  className?: string
}


export function LoyaltyCard({ 
  punchCount, 
  goal, 
  rewarded, 
  tier, 
  totalPoints, 
  lifetimeVisits,
  onAddVisit, 
  onMarkRewarded, 
  className 
}: LoyaltyCardProps) {
  const punches = Array.from({ length: goal }, (_, i) => i < punchCount)
  const progress = Math.min((punchCount / goal) * 100, 100)
  const isComplete = punchCount >= goal
  const tierConfig = getTierConfig(tier)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tier Status Card */}
      <Card className="border-2" style={{ borderColor: tierConfig.color }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="truncate">{tierConfig.name} Member</span>
            <span className="text-xl sm:text-2xl">{tierConfig.icon}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">Total Points</p>
              <p className="font-bold text-base sm:text-lg">{totalPoints}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">Lifetime Visits</p>
              <p className="font-bold text-base sm:text-lg">{lifetimeVisits}</p>
            </div>
          </div>
          
          <div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-2">Available Rewards</p>
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

      {/* Punch Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="truncate">Punch Card</span>
            {rewarded && (
              <Badge variant="default" className="flex items-center gap-1 text-xs">
                <span className="hidden sm:inline">Rewarded</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Punch Icons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                {punches.map((filled, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                      filled 
                        ? "bg-primary border-primary text-white" 
                        : "bg-transparent border-border text-muted-foreground"
                    )}
                    aria-label={filled ? "punched" : "empty"}
                  >
                    <span className="text-xs">🍺</span>
                  </div>
                ))}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium ml-2">
                {punchCount}/{goal}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{goal}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {onAddVisit && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onAddVisit} 
                disabled={isComplete || rewarded}
                className="flex-1 sm:flex-none"
              >
                <span className="text-xs sm:text-sm">Add Visit</span>
              </Button>
            )}
            {onMarkRewarded && (
              <Button 
                size="sm" 
                variant="default" 
                onClick={onMarkRewarded} 
                disabled={!isComplete || rewarded}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">Mark as Rewarded</span>
              </Button>
            )}
          </div>
          
          {/* Completion Message */}
          {isComplete && !rewarded && (
            <div className="mt-2 text-xs sm:text-sm text-yellow-700 bg-yellow-50 rounded p-2 flex items-center gap-2">
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
              <span>Goal reached! Mark as rewarded to reset the card.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 