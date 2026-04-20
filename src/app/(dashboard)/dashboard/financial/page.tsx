"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart2, Euro, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { formatDateGB, formatDateTimeGB } from '@/utils/dateUtils';
import { getFinancialAnalytics, getFinancialTransactions, calculateTaxInfo, exportForAccountants } from '@/lib/financial';
import { formatCurrency } from '@/lib/financial';
import { FinancialAnalytics, FinancialTransaction, TaxInfo, PaymentTransaction } from '@/types/financial';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { 
  PageHeaderSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  DataTableSkeleton
} from '@/components/ui/loading-states';

const supabase = createClient();

function transactionTypeLabel(t: FinancialTransaction['transaction_type']): string {
  switch (t) {
    case 'income':
      return 'Income'
    case 'expense':
      return 'Expense'
    case 'refund':
      return 'Refund'
    case 'adjustment':
      return 'Adjustment'
    default:
      return t
  }
}

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });

export default function FinancialDashboardPage() {
  const [startDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate] = useState(() => new Date());
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [outstandingPayments, setOutstandingPayments] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [analytics, txs, tax, payments] = await Promise.all([
          getFinancialAnalytics(startDate, endDate),
          getFinancialTransactions({ start_date: startDate, end_date: endDate }),
          calculateTaxInfo(startDate, endDate),
          supabase.from('payment_transactions').select('*').eq('status', 'pending')
        ]);
        setAnalytics(analytics);
        setTransactions(txs);
        setTaxInfo(tax);
        setOutstandingPayments((payments.data as PaymentTransaction[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to load financial data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const exportData = await exportForAccountants(startDate, endDate, 'csv');
      // Create CSV string
      const csvRows = [
        ['Date', 'Type', 'Category', 'Source', 'Amount', 'Tax', 'Description', 'Payment Method', 'Reference'],
        ...exportData.transactions.map(t => [
          formatDateTimeGB(new Date(t.transaction_date)),
          transactionTypeLabel(t.transaction_type),
          t.category,
          t.source ?? '',
          t.amount,
          t.tax_amount ?? '',
          t.description,
          t.payment_method || '',
          t.reference || '',
        ])
      ];
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-export-${formatDateGB(startDate)}_to_${formatDateGB(endDate)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to export data';
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  // Memoized values for KPIs
  const totalRevenue = analytics?.current_period.total_revenue ?? 0;
  const salesTax = analytics?.total_tax_collected ?? 0;
  const topSource = analytics?.top_revenue_sources?.[0]?.source ?? '--';

  if (loading && !analytics) {
    return (
      <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
        <PageHeaderSkeleton showActions={true} />
        <StatCardSkeleton count={4} />
        <ChartSkeleton height={300} />
        <DataTableSkeleton rows={8} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" /> : <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Sales Tax Collected</CardTitle>
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" /> : <div className="text-lg sm:text-2xl font-bold">{formatCurrency(salesTax)}</div>}
            <div className="text-xs text-muted-foreground mt-1">Tax Rate: {taxInfo?.sales_tax_rate ?? 8.5}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Outstanding Payments</CardTitle>
            <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" /> : <div className="text-lg sm:text-2xl font-bold">{formatCurrency(outstandingPayments)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Top Source</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" /> : <div className="text-lg sm:text-2xl font-bold">{topSource}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" /> Revenue Trends
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Export CSV
          </Button>
        </div>
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : loading ? (
          <Skeleton className="h-48 sm:h-64 w-full" />
        ) : analytics?.revenue_trend?.length ? (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenue_trend} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value: number) => formatCurrency(Number(value))} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400 text-sm sm:text-base">No revenue data for this period.</div>
        )}
      </div>

      {/* Transaction Breakdown Table */}
      <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> Transaction Breakdown
        </h2>
        {error ? (
          <Alert variant="destructive">{error}</Alert>
        ) : loading ? (
          <Skeleton className="h-40 w-full" />
        ) : transactions.length ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDateTimeGB(new Date(tx.transaction_date))}</TableCell>
                      <TableCell>{transactionTypeLabel(tx.transaction_type)}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell>{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{tx.payment_method || ''}</TableCell>
                      <TableCell>{tx.reference || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{formatDateTimeGB(new Date(tx.transaction_date))}</span>
                    <span className="text-sm font-bold">{formatCurrency(tx.amount)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Type:</span>
                      <span className="text-sm">{transactionTypeLabel(tx.transaction_type)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Category:</span>
                      <span className="text-sm">{tx.category}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Description:</span>
                      <span className="text-sm">{tx.description}</span>
                    </div>
                    
                    {tx.payment_method && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Payment Method:</span>
                        <span className="text-sm">{tx.payment_method}</span>
                      </div>
                    )}
                    
                    {tx.reference && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Reference:</span>
                        <span className="text-sm">{tx.reference}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm sm:text-base">No transactions for this period.</div>
        )}
      </div>
    </div>
  );
} 