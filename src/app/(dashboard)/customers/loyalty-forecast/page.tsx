'use client'

import { useAuth } from '@/hooks/useAuth';
import { LoyaltyRewardForecast } from '@/components/estimators/LoyaltyRewardForecast';

export default function LoyaltyForecastPage() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <div className="max-w-xl mx-auto mt-8 text-center text-destructive font-semibold">403 – Not authorized</div>;
  }
  return <LoyaltyRewardForecast isAdmin={true} />;
} 