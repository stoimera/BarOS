'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { fetchCustomersWithLoyalty } from '@/lib/customers';
import type { CustomerWithLoyalty } from '@/types/customer';

interface LoyaltyRewardForecastProps {
  isAdmin: boolean;
}

interface ForecastInputs {
  customerId: string;
  visitFrequency: number;
  avgSpend: number;
  loyaltyGoal: number;
}

interface ForecastResults {
  estimatedRewardDate: Date;
  projectedValue: number;
  currentPunches: number;
}

export const LoyaltyRewardForecast: React.FC<LoyaltyRewardForecastProps> = ({ isAdmin }) => {
  const [customers, setCustomers] = useState<CustomerWithLoyalty[]>([]);
  const [inputs, setInputs] = useState<ForecastInputs>({
    customerId: '',
    visitFrequency: 1,
    avgSpend: 20,
    loyaltyGoal: 10,
  });
  const [results, setResults] = useState<ForecastResults | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchCustomersWithLoyalty({ limit: 100 }).then(({ data }) => {
      setCustomers(data);
    });
  }, []);

  if (!isAdmin) return null;

  const handleChange = (field: keyof ForecastInputs, value: string | number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === inputs.customerId);
    const currentPunches = customer?.current_punches || 0;
    const punchesNeeded = Math.max(inputs.loyaltyGoal - currentPunches, 0);
    const weeksNeeded = punchesNeeded / (inputs.visitFrequency || 1);
    const estimatedRewardDate = new Date();
    estimatedRewardDate.setDate(estimatedRewardDate.getDate() + Math.ceil(weeksNeeded * 7));
    const projectedValue = inputs.loyaltyGoal * inputs.avgSpend;
    setResults({ estimatedRewardDate, projectedValue, currentPunches });
    setSubmitted(true);
  };

  const selectedCustomer = customers.find(c => c.id === inputs.customerId);
  const punches = selectedCustomer?.current_punches || 0;
  const goal = inputs.loyaltyGoal;

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Loyalty Reward Forecast Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <select
              id="customer"
              value={inputs.customerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('customerId', e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
            >
              <option value="" disabled>Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="visitFrequency">Visit Frequency (per week)</Label>
            <Input
              id="visitFrequency"
              type="number"
              min={1}
              value={inputs.visitFrequency}
              onChange={e => handleChange('visitFrequency', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label htmlFor="avgSpend">Avg Spend Per Visit (€)</Label>
            <Input
              id="avgSpend"
              type="number"
              min={0}
              step={0.01}
              value={inputs.avgSpend}
              onChange={e => handleChange('avgSpend', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label htmlFor="loyaltyGoal">Loyalty Goal (punches)</Label>
            <Input
              id="loyaltyGoal"
              type="number"
              min={1}
              value={inputs.loyaltyGoal}
              onChange={e => handleChange('loyaltyGoal', Number(e.target.value))}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2">Forecast Reward</Button>
        </form>
        {submitted && results && (
          <>
            <Separator className="my-6" />
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg text-muted-foreground">👤</span>
                <span className="font-semibold">{selectedCustomer?.name}</span>
                <Badge variant="secondary">Current Punches: {punches}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-muted-foreground">🗓️</span>
                <span>Estimated Reward Date: <span className="font-bold">{results.estimatedRewardDate.toLocaleDateString('en-GB')}</span></span>
              </div>
              <div>
                <Badge variant="outline">Projected Value: €{results.projectedValue.toFixed(2)}</Badge>
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <Progress value={Math.min((punches / goal) * 100, 100)} className="w-64" />
                <div className="flex gap-1">
                  {[...Array(goal)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        'inline-block w-5 h-5 rounded-full border ' +
                        (i < punches ? 'bg-primary border-primary' : 'bg-muted border-gray-300')
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{punches} / {goal} punches</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 