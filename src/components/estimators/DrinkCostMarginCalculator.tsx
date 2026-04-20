'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateProfitMargin } from '@/utils/business-logic';

interface DrinkCostMarginCalculatorProps {
  isAdmin: boolean;
}

interface CalculatorInputs {
  drinkName: string;
  ingredientCosts: number;
  salePrice: number;
  isHappyHour: boolean;
}

interface CalculatorResults {
  profit: number;
  margin: number;
  category: 'green' | 'yellow' | 'red';
}

function getMarginCategoryLocal(margin: number): 'green' | 'yellow' | 'red' {
  if (margin >= 70) return 'green';
  if (margin >= 40) return 'yellow';
  return 'red';
}

function getCategoryLabel(category: 'green' | 'yellow' | 'red') {
  if (category === 'green') return 'Excellent';
  if (category === 'yellow') return 'Moderate';
  return 'Low';
}

export const DrinkCostMarginCalculator: React.FC<DrinkCostMarginCalculatorProps> = ({ isAdmin }) => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    drinkName: '',
    ingredientCosts: 0,
    salePrice: 0,
    isHappyHour: false,
  });
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isAdmin) return null;

  const handleChange = (field: keyof CalculatorInputs, value: string | number | boolean) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profit = inputs.salePrice - inputs.ingredientCosts;
    const margin = calculateProfitMargin(inputs.ingredientCosts, inputs.salePrice);
    const category = getMarginCategoryLocal(margin);
    setResults({ profit, margin, category });
    setSubmitted(true);
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Drink Cost Margin Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="drinkName">Drink Name</Label>
            <Input
              id="drinkName"
              value={inputs.drinkName}
              onChange={e => handleChange('drinkName', e.target.value)}
              placeholder="e.g. Mojito"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ingredientCosts">Ingredient Costs (€)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" tabIndex={-1}>
                  <span className="text-sm text-muted-foreground">ℹ️</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm">
                Total cost of all ingredients for one serving of this drink.
              </PopoverContent>
            </Popover>
          </div>
          <Input
            id="ingredientCosts"
            type="number"
            min={0}
            step={0.01}
            value={inputs.ingredientCosts}
            onChange={e => handleChange('ingredientCosts', Number(e.target.value))}
            required
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="salePrice">Sale Price (€)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" tabIndex={-1}>
                  <span className="text-sm text-muted-foreground">ℹ️</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm">
                The price you charge customers for this drink.
              </PopoverContent>
            </Popover>
          </div>
          <Input
            id="salePrice"
            type="number"
            min={0}
            step={0.01}
            value={inputs.salePrice}
            onChange={e => handleChange('salePrice', Number(e.target.value))}
            required
          />
          <div className="flex items-center gap-2">
            <input
              id="isHappyHour"
              type="checkbox"
              checked={inputs.isHappyHour}
              onChange={e => handleChange('isHappyHour', e.target.checked)}
              className="mr-2"
            />
            <Label htmlFor="isHappyHour">Is Happy Hour?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" tabIndex={-1}>
                  <span className="text-sm text-muted-foreground">ℹ️</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm">
                Toggle if this price is for happy hour. (For info only; does not affect calculation.)
              </PopoverContent>
            </Popover>
          </div>
          <Button type="submit" className="w-full mt-2">Calculate Margin</Button>
        </form>
        {submitted && results && (
          <>
            <Separator className="my-6" />
            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-2">
                <Badge variant="outline">Profit per Drink: <span className="font-bold ml-1">€{results.profit.toFixed(2)}</span></Badge>
                <Badge
                  className={
                    results.category === 'green'
                      ? 'bg-green-500 text-white'
                      : results.category === 'yellow'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-red-500 text-white'
                  }
                >
                  Gross Margin: {results.margin.toFixed(1)}% ({getCategoryLabel(results.category)})
                </Badge>
              </div>
              <Progress value={Math.min(results.margin, 100)} className="w-64" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 