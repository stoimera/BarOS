'use client'

import { useAuth } from '@/hooks/useAuth';
import { EventRevenueEstimator } from '@/components/estimators/EventRevenueEstimator';

export default function RevenueEstimatorPage() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <div className="max-w-xl mx-auto mt-8 text-center text-destructive font-semibold">403 – Not authorized</div>;
  }
  return <EventRevenueEstimator isAdmin={true} />;
} 