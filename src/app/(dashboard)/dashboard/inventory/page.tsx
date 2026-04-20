"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Loader2,
  Euro,
  ShoppingCart
} from 'lucide-react'
import { 
  predictLowStockItems, 
  generateReorderSuggestions, 
  getInventoryAnalytics 
} from '@/lib/inventory';
import { StockPrediction, ReorderSuggestion, InventoryAnalytics } from '@/lib/inventory';
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states';

export default function InventoryOptimizationPage() {
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [predictionsData, suggestionsData, analyticsData] = await Promise.all([
        predictLowStockItems(),
        generateReorderSuggestions(),
        getInventoryAnalytics()
      ]);
      setPredictions(predictionsData);
      setSuggestions(suggestionsData);
      setAnalytics(analyticsData);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load inventory optimization data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    
    return <Badge variant={variants[urgency] || "outline"}>{urgency}</Badge>;
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
        <PageHeaderSkeleton showActions={false} />
        <StatCardSkeleton count={4} />
        <ChartSkeleton height={300} />
        <DataTableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.total_items || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.low_stock_items || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Out of Stock</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{analytics?.out_of_stock_items || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
            <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-16" /> : <div className="text-lg sm:text-2xl font-bold">{formatCurrency(analytics?.total_value || 0)}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Predictions */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" /> Low Stock Predictions
          </h2>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Refresh
          </Button>
        </div>
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : loading ? (
          <Skeleton className="h-40 w-full" />
        ) : predictions.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Days Until Stockout</TableHead>
                    <TableHead>Predicted Demand</TableHead>
                    <TableHead>Reorder Quantity</TableHead>
                    <TableHead>Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map(prediction => (
                    <TableRow key={prediction.item_id}>
                      <TableCell className="font-medium">{prediction.item_name}</TableCell>
                      <TableCell>{prediction.quantity}</TableCell>
                      <TableCell>
                        <span className={prediction.days_until_stockout <= 7 ? 'text-red-600 font-medium' : ''}>
                          {prediction.days_until_stockout} days
                        </span>
                      </TableCell>
                      <TableCell>{Math.round(prediction.predicted_demand)}</TableCell>
                      <TableCell>{prediction.reorder_quantity}</TableCell>
                      <TableCell>{getUrgencyBadge(prediction.urgency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {predictions.map(prediction => (
                <div
                  key={prediction.item_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm sm:text-base">{prediction.item_name}</h3>
                    <div className="flex items-center justify-between">
                      {getUrgencyBadge(prediction.urgency)}
                      <span className={prediction.days_until_stockout <= 7 ? 'text-red-600 font-medium text-sm' : 'text-sm'}>
                        {prediction.days_until_stockout} days
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Current Stock</div>
                      <div className="font-medium">{prediction.quantity}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Predicted Demand</div>
                      <div className="font-medium">{Math.round(prediction.predicted_demand)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Reorder Quantity</div>
                      <div className="font-medium">{prediction.reorder_quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No low stock predictions found.</div>
        )}
      </div>

      {/* Reorder Suggestions */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" /> Reorder Suggestions
        </h2>
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : loading ? (
          <Skeleton className="h-40 w-full" />
        ) : suggestions.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Suggested Quantity</TableHead>
                    <TableHead>Estimated Cost</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map(suggestion => (
                    <TableRow key={suggestion.item_id}>
                      <TableCell className="font-medium">{suggestion.item_name}</TableCell>
                      <TableCell>{suggestion.quantity}</TableCell>
                      <TableCell>{suggestion.suggested_quantity}</TableCell>
                      <TableCell>{formatCurrency(suggestion.estimated_cost)}</TableCell>
                      <TableCell>{suggestion.reason}</TableCell>
                      <TableCell>{getUrgencyBadge(suggestion.urgency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.item_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm sm:text-base">{suggestion.item_name}</h3>
                    <div className="flex items-center justify-between">
                      {getUrgencyBadge(suggestion.urgency)}
                      <span className="text-sm font-bold">{formatCurrency(suggestion.estimated_cost)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">{suggestion.reason}</div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Current Stock</div>
                        <div className="font-medium">{suggestion.quantity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Suggested Qty</div>
                        <div className="font-medium">{suggestion.suggested_quantity}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No reorder suggestions found.</div>
        )}
      </div>

      {/* Top Selling Items */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Top Selling Items
        </h2>
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : loading ? (
          <Skeleton className="h-40 w-full" />
        ) : analytics?.top_selling_items?.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.top_selling_items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.quantity_sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {analytics.top_selling_items.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{item.item_name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Quantity Sold</div>
                    <div className="font-bold text-lg">{item.quantity_sold}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No sales data available.</div>
        )}
      </div>
    </div>
  );
} 