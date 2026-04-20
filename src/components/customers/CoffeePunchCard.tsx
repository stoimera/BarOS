import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

interface CoffeePunchCardProps {
  punchCount: number
  goal: number
  rewarded: boolean
  mode?: "staff" | "customer"
  onAddVisit?: () => void
  onMarkRewarded?: () => void
  className?: string
  // New props for coffee-specific punch card
  coffeePunchCount?: number
  coffeeGoal?: number
  coffeeRewarded?: boolean
  onAddCoffeeVisit?: () => void
  onMarkCoffeeRewarded?: () => void
}

export function CoffeePunchCard({ 
  punchCount, 
  goal, 
  rewarded, 
  mode = "staff",
  onAddVisit, 
  onMarkRewarded, 
  className,
  coffeePunchCount,
  coffeeGoal,
  coffeeRewarded,
  onAddCoffeeVisit,
  onMarkCoffeeRewarded
}: CoffeePunchCardProps) {
  // Use coffee-specific values if provided, otherwise fall back to general values
  const actualPunchCount = coffeePunchCount ?? punchCount;
  const actualGoal = coffeeGoal ?? goal;
  const actualRewarded = coffeeRewarded ?? rewarded;
  const actualOnAddVisit = onAddCoffeeVisit ?? onAddVisit;
  const actualOnMarkRewarded = onMarkCoffeeRewarded ?? onMarkRewarded;

  const punches = Array.from({ length: actualGoal }, (_, i) => i < actualPunchCount)
  const progress = Math.min((actualPunchCount / actualGoal) * 100, 100)
  const isComplete = actualPunchCount >= actualGoal

  return (
    <Card className={cn(" overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="text-base sm:text-lg text-primary flex-shrink-0">☕</span>
          <span className="truncate">Coffee Punch Card</span>
          {actualRewarded && (
            <Badge variant="default" className="flex items-center gap-1 text-foreground border-border bg-muted text-xs sm:text-sm flex-shrink-0">
              <span className="text-xs sm:text-sm">✓</span> 
              <span className="hidden sm:inline">Rewarded</span>
              <span className="sm:hidden">✓</span>
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
                    "w-6 h-6 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                    filled 
                      ? "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/55 dark:border-sky-700 dark:text-sky-100"
                      : "bg-transparent border-border text-muted-foreground"
                  )}
                  aria-label={filled ? "punched" : "empty"}
                >
                  <span className="text-xs sm:text-sm">☕</span>
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium flex-shrink-0 ml-2">
              {actualPunchCount}/{actualGoal}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2 bg-sky-200/70 dark:bg-sky-900/45"
              indicatorClassName="bg-sky-500 dark:bg-sky-400"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{actualGoal}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {actualOnAddVisit && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={actualOnAddVisit} 
              disabled={isComplete || actualRewarded}
              className="text-xs sm:text-sm"
            >
              <span className="text-xs sm:text-sm mr-1">➕</span> 
              <span className="hidden sm:inline">Add Coffee Visit</span>
              <span className="sm:hidden">Add Visit</span>
            </Button>
          )}
          {actualOnMarkRewarded && (
            <Button 
              size="sm" 
              variant="default" 
              onClick={actualOnMarkRewarded} 
              disabled={!isComplete || actualRewarded}
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
              <span className="hidden sm:inline">Mark as Rewarded</span>
              <span className="sm:hidden">Reward</span>
            </Button>
          )}
        </div>
        
        {/* Completion Message */}
        {isComplete && !actualRewarded && (
          <div className="mt-2 text-xs sm:text-sm text-foreground bg-muted rounded p-2 flex items-center gap-2">
            <span className="text-xs sm:text-sm text-sky-500 dark:text-sky-400 flex-shrink-0">🎁</span>
            <span className="truncate">
              {mode === "customer"
                ? 'Goal reached! Use "Show my QR code" below so staff can scan and redeem.'
                : "Goal reached! Mark as rewarded to reset the card."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 