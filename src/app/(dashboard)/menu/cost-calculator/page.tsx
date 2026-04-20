'use client'

import { useAuth } from '@/hooks/useAuth';
import { DrinkCostMarginCalculator } from '@/components/estimators/DrinkCostMarginCalculator';

export default function CostCalculatorPage() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <div className="max-w-xl mx-auto mt-8 text-center text-destructive font-semibold">403 – Not authorized</div>;
  }
  return <DrinkCostMarginCalculator isAdmin={true} />;
} 