'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { DatePicker } from '../ui/date-picker';

interface EventRevenueEstimatorProps {
  isAdmin: boolean;
}

interface EstimatorInputs {
  eventName?: string;
  eventDate?: Date | null;
  attendees: number;
  avgSpend: number;
  fixedCosts?: number;
}

interface EstimatorResults {
  grossRevenue: number;
  netRevenue: number;
}

export const EventRevenueEstimator: React.FC<EventRevenueEstimatorProps> = ({ isAdmin }) => {
  const [inputs, setInputs] = useState<EstimatorInputs>({
    eventName: '',
    eventDate: null,
    attendees: 0,
    avgSpend: 0,
    fixedCosts: 0,
  });
  const [results, setResults] = useState<EstimatorResults | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isAdmin) return null;

  const handleChange = (field: keyof EstimatorInputs, value: string | number | Date | null) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grossRevenue = inputs.attendees * inputs.avgSpend;
    const netRevenue = grossRevenue - (inputs.fixedCosts || 0);
    setResults({ grossRevenue, netRevenue });
    setSubmitted(true);
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Event Revenue Estimator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventName">Event Name (optional)</Label>
            <Input
              id="eventName"
              value={inputs.eventName}
              onChange={e => handleChange('eventName', e.target.value)}
              placeholder="e.g. Summer Party"
            />
          </div>
          <div>
            <Label htmlFor="eventDate">Event Date (optional)</Label>
            <DatePicker
              id="eventDate"
              value={inputs.eventDate ?? null}
              onChange={(date: Date | null) => handleChange('eventDate', date)}
              placeholder="Select date"
            />
          </div>
          <div>
            <Label htmlFor="attendees">Expected Number of Attendees</Label>
            <Input
              id="attendees"
              type="number"
              min={0}
              value={inputs.attendees}
              onChange={e => handleChange('attendees', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label htmlFor="avgSpend">Average Spend Per Person (€)</Label>
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
            <Label htmlFor="fixedCosts">Fixed Event Costs (€) (optional)</Label>
            <Input
              id="fixedCosts"
              type="number"
              min={0}
              step={0.01}
              value={inputs.fixedCosts}
              onChange={e => handleChange('fixedCosts', Number(e.target.value))}
            />
          </div>
          <Button type="submit" className="w-full mt-2">Estimate Revenue</Button>
        </form>
        {submitted && results && (
          <>
            <Separator className="my-6" />
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-2">
                <Badge variant="outline">Gross Revenue: <span className="font-bold ml-1">€{results.grossRevenue.toFixed(2)}</span></Badge>
                <Badge variant="secondary">Net Revenue: <span className="font-bold ml-1">€{results.netRevenue.toFixed(2)}</span></Badge>
              </div>
              {/* Optional: Add a bar chart here if desired */}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 