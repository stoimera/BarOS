"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  EnhancedReward, 
  RewardCategory, 
  RewardStatus,
  REWARD_TEMPLATES
} from "@/types/rewards";
import { redeemReward, createAgeVerification } from "@/lib/enhanced-rewards";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Shield, CheckCircle, Info, AlertTriangle, Gift, Clock, Copy } from "lucide-react";

interface EnhancedRewardCardProps {
  reward: EnhancedReward;
  onRewardClaimed?: () => void;
  staffId?: string;
  className?: string;
}


const rewardCategoryColors = {
  [RewardCategory.BIRTHDAY]: "bg-pink-100 text-pink-800 border-pink-200",
  [RewardCategory.LOYALTY_PUNCH_CARD]: "bg-muted text-foreground border-border",
  [RewardCategory.FREE_COFFEE]: "bg-muted text-foreground border-border",
  [RewardCategory.FREE_ALCOHOLIC_DRINK]: "bg-red-100 text-red-800 border-red-200",
  [RewardCategory.DISCOUNT]: "bg-green-100 text-green-800 border-green-200",
  [RewardCategory.VIP_ACCESS]: "bg-purple-100 text-purple-800 border-purple-200",
  [RewardCategory.REFERRAL]: "bg-indigo-100 text-indigo-800 border-indigo-200",
  [RewardCategory.MILESTONE]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [RewardCategory.CUSTOM]: "bg-muted text-muted-foreground border-border",
};

// Generate a unique voucher code
const generateVoucherCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function EnhancedRewardCard({ 
  reward, 
  onRewardClaimed, 
  staffId,
  className 
}: EnhancedRewardCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'id_check' | 'self_declaration' | 'manager_override'>('id_check');
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState<{
    code: string;
    reward: EnhancedReward;
    expiresAt: Date;
  } | null>(null);

  const isExpired = new Date(reward.expires_at) < new Date();
  const isActive = reward.status === RewardStatus.ACTIVE && !reward.claimed && !isExpired;
  const template = REWARD_TEMPLATES.find(t => t.category === reward.category);

  const handleClaimReward = async () => {
    if (!staffId) {
      toast.error('Staff ID required to claim reward');
      return;
    }

    if (reward.requires_age_verification && !ageVerified) {
      setShowAgeVerification(true);
      return;
    }

    setIsClaiming(true);
    try {
      const redeemedReward = await redeemReward({
        reward_id: reward.id,
        staff_id: staffId,
        customer_age_verified: ageVerified,
        notes: ageVerified ? `Age verified via ${verificationMethod}` : undefined
      });

      // Create age verification record if needed
      if (reward.requires_age_verification && ageVerified) {
        await createAgeVerification({
          customer_id: reward.customer_id,
          verified_by_staff_id: staffId,
          verification_method: verificationMethod,
          verified_at: new Date(),
          notes: `Verified for ${reward.category} reward`
        });
      }

      // Use the redemption code from the database response
      setVoucherData({
        code: redeemedReward.redemption_code || generateVoucherCode(), // Fallback to client-side generation
        reward: redeemedReward,
        expiresAt: new Date(redeemedReward.expires_at)
      });
      setShowVoucher(true);

      toast.success('Reward claimed successfully! Your voucher is ready.');
      onRewardClaimed?.();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setIsClaiming(false);
      setShowAgeVerification(false);
      setAgeVerified(false);
    }
  };

  const handleAgeVerification = () => {
    setAgeVerified(true);
    setShowAgeVerification(false);
    handleClaimReward();
  };

  const copyVoucherCode = async () => {
    if (!voucherData) return;
    
    try {
      await navigator.clipboard.writeText(voucherData.code);
      toast.success("Voucher code copied to clipboard!");
    } catch {
      toast.error("Failed to copy voucher code");
    }
  };

  const getStatusBadge = () => {
    if (reward.claimed) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Claimed</Badge>;
    }
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    }
    return <Badge className="bg-muted text-foreground border-border">Active</Badge>;
  };

  return (
    <>
      <Card className={`${className} ${isActive ? 'border-2 border-primary' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
              </div>
              <div>
                <CardTitle className="text-lg">{reward.description}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={rewardCategoryColors[reward.category]}>
                    {reward.category.replace('_', ' ')}
                  </Badge>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
            {reward.value && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">€{reward.value}</div>
                <div className="text-sm text-gray-500">Value</div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Expires: {format(new Date(reward.expires_at), 'MMM d, yyyy')}</span>
            </div>
            {reward.requires_age_verification && (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-amber-600 text-xs">Age Verification Required</span>
              </div>
            )}
          </div>

          {template && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Terms & Conditions:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {template.conditions?.map((condition, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reward.claimed && reward.claimed_at && (
            <div className="flex items-center gap-2 text-sm text-foreground bg-muted p-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>Claimed on {format(new Date(reward.claimed_at), 'MMM d, yyyy')}</span>
            </div>
          )}

          {isActive && staffId && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleClaimReward}
                disabled={isClaiming}
                className="flex-1"
              >
                {isClaiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Claim Reward
                  </>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Claiming a reward generates a unique voucher code. Show this code to staff at Urban Lounge to redeem your reward. Vouchers can only be used once and expire on the date shown.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {isActive && !staffId && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Staff login required to claim this reward
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Age Verification Dialog */}
      <Dialog open={showAgeVerification} onOpenChange={setShowAgeVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Age Verification Required
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This reward requires age verification. Please select your verification method:
            </p>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verification"
                  value="id_check"
                  checked={verificationMethod === 'id_check'}
                  onChange={(e) => setVerificationMethod(e.target.value as any)}
                  className="text-amber-600"
                />
                <span className="text-sm">ID Check</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verification"
                  value="self_declaration"
                  checked={verificationMethod === 'self_declaration'}
                  onChange={(e) => setVerificationMethod(e.target.value as any)}
                  className="text-amber-600"
                />
                <span className="text-sm">Self Declaration</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verification"
                  value="manager_override"
                  checked={verificationMethod === 'manager_override'}
                  onChange={(e) => setVerificationMethod(e.target.value as any)}
                  className="text-amber-600"
                />
                <span className="text-sm">Manager Override</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAgeVerification}
                className="flex-1"
              >
                Verify Age
              </Button>
              <Button 
                onClick={() => setShowAgeVerification(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Modal */}
      <Dialog open={showVoucher} onOpenChange={setShowVoucher}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              Your Voucher is Ready!
            </DialogTitle>
          </DialogHeader>
          
          {voucherData && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                    {voucherData.code}
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Show this code to staff when redeeming
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{voucherData.reward.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span>Valid until {format(voucherData.expiresAt, 'MMM d, yyyy')}</span>
                  </div>
                  {voucherData.reward.value && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600">Value: €{voucherData.reward.value}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700">Status: Ready to use</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted border border-border rounded-lg p-3">
                <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How to use your voucher:
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Visit Urban Lounge during business hours</li>
                  <li>• Show this code to any staff member</li>
                  <li>• Staff will verify and redeem your reward</li>
                  <li>• Voucher will be marked as used automatically</li>
                  <li>• One-time use only - cannot be reused</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={copyVoucherCode}
                  className="flex-1"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button 
                  onClick={() => setShowVoucher(false)}
                  className="flex-1"
                >
                  Got it!
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                <p>This voucher will disappear from your account once used</p>
                <p>Keep this code safe - it cannot be regenerated</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 