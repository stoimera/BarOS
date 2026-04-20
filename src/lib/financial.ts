import { supabase } from './supabase'
import { mapFinancialTransactionFromDb } from './financial-map'
import {
  FinancialTransaction, 
  Revenue, 
  Expense, 
  FinancialAnalytics, 
  FinancialPeriod, 
  TaxInfo,
  FinancialFilters,
  AccountantExport,
  PaymentTransaction
} from '@/types/financial'
import { 
  startOfMonth, 
  startOfYear, 
  format,
  subDays,
  subMonths,
  eachDayOfInterval,
} from 'date-fns'

export { mapFinancialTransactionFromDb }

// Financial transaction CRUD operations
export async function createFinancialTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([{
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      transaction_date: transaction.transaction_date.toISOString().split('T')[0],
      payment_method: transaction.payment_method,
      reference: transaction.reference,
      source: transaction.source ?? null,
      customer_id: transaction.customer_id ?? null,
      booking_id: transaction.booking_id ?? null,
      event_id: transaction.event_id ?? null,
      supplier: transaction.supplier ?? null,
      invoice_number: transaction.invoice_number ?? null,
      tax_amount: transaction.tax_amount ?? null,
    }])
    .select()
    .single()

  if (error) throw error
  return mapFinancialTransactionFromDb(data)
}

export async function getFinancialTransactions(filters: FinancialFilters = {}): Promise<FinancialTransaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })

  if (filters.start_date) {
    query = query.gte('transaction_date', filters.start_date.toISOString().split('T')[0])
  }

  if (filters.end_date) {
    query = query.lte('transaction_date', filters.end_date.toISOString().split('T')[0])
  }

  if (filters.transaction_type) {
    query = query.eq('transaction_type', filters.transaction_type)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.payment_method) {
    query = query.eq('payment_method', filters.payment_method)
  }

  if (filters.min_amount) {
    query = query.gte('amount', filters.min_amount)
  }

  if (filters.max_amount) {
    query = query.lte('amount', filters.max_amount)
  }

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapFinancialTransactionFromDb)
}

export async function updateFinancialTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  const dbUpdates: Record<string, unknown> = { ...updates }
  if (updates.transaction_date) {
    dbUpdates.transaction_date = new Date(updates.transaction_date).toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapFinancialTransactionFromDb(data)
}

export async function deleteFinancialTransaction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Financial period calculations
export async function getFinancialPeriod(startDate: Date, endDate: Date): Promise<FinancialPeriod> {
  const transactions = await getFinancialTransactions({ start_date: startDate, end_date: endDate })
  
  const revenue = transactions.filter(t => t.transaction_type === 'income')
  const expenses = transactions.filter(t => t.transaction_type === 'expense')
  
  const totalRevenue = revenue.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const grossProfit = totalRevenue - totalExpenses // Simplified for now
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    start_date: startDate,
    end_date: endDate,
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    gross_profit: grossProfit,
    profit_margin: profitMargin,
    transaction_count: transactions.length
  }
}

// Financial analytics
export async function getFinancialAnalytics(startDate?: Date, endDate?: Date): Promise<FinancialAnalytics> {
  const end = endDate || new Date()
  const start = startDate || startOfMonth(end)
  
  // Get current period
  const currentPeriod = await getFinancialPeriod(start, end)
  
  // Get previous period
  const previousStart = subMonths(start, 1)
  const previousEnd = subDays(start, 1)
  const previousPeriod = await getFinancialPeriod(previousStart, previousEnd)
  
  // Get year to date
  const ytdStart = startOfYear(end)
  const ytdPeriod = await getFinancialPeriod(ytdStart, end)
  
  // Get all transactions for detailed analysis
  const transactions = await getFinancialTransactions({ start_date: start, end_date: end })
  const revenue = transactions.filter(t => t.transaction_type === 'income') as Revenue[]
  const expenses = transactions.filter(t => t.transaction_type === 'expense') as Expense[]
  
  // Revenue breakdown
  const revenueByCategory = calculateCategoryBreakdown(revenue, 'category')
  const revenueBySource = calculateCategoryBreakdown(revenue, 'source')
  
  // Expense breakdown
  const expensesByCategory = calculateCategoryBreakdown(expenses, 'category')
  
  // Trends
  const revenueTrend = calculateTrend(revenue, 'amount', start, end)
  const expensesTrend = calculateTrend(expenses, 'amount', start, end)
  const profitTrend = revenueTrend.map((item, index) => ({
    date: item.date,
    profit: item.revenue - (expensesTrend[index]?.expenses || 0)
  }))
  
  // Cash flow
  const cashFlow = calculateCashFlow(transactions, start, end)
  
  // Key metrics
  const averageTransactionValue = transactions.length > 0 
    ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
    : 0
  
  const topRevenueSources = revenueBySource
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(item => ({ source: item.category, amount: item.amount }))
  
  const topExpenseCategories = expensesByCategory
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(item => ({ category: item.category, amount: item.amount }))
  
  // Tax calculations
  const taxInfo = await calculateTaxInfo(start, end)
  
  return {
    current_period: currentPeriod,
    previous_period: previousPeriod,
    year_to_date: ytdPeriod,
    revenue_by_category: revenueByCategory,
    revenue_by_source: revenueBySource.map(item => ({ source: item.category, amount: item.amount, percentage: item.percentage })),
    revenue_trend: revenueTrend.map(item => ({ date: item.date, revenue: item.revenue })),
    expenses_by_category: expensesByCategory,
    expenses_trend: expensesTrend.map(item => ({ date: item.date, expenses: item.expenses })),
    profit_trend: profitTrend,
    profit_margin_trend: profitTrend.map(item => ({ 
      date: item.date, 
      margin: item.profit > 0 ? (item.profit / (item.profit + (expensesTrend.find(e => e.date === item.date)?.expenses || 0))) * 100 : 0 
    })),
    cash_flow: cashFlow,
    average_transaction_value: averageTransactionValue,
    top_revenue_sources: topRevenueSources,
    top_expense_categories: topExpenseCategories,
    total_tax_collected: taxInfo.tax_collected,
    total_tax_paid: taxInfo.tax_paid,
    net_tax_liability: taxInfo.tax_liability
  }
}

// Helper functions
function calculateCategoryBreakdown(transactions: any[], categoryField: string) {
  const breakdown: { [key: string]: number } = {}
  const total = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  
  transactions.forEach(transaction => {
    const category = String(transaction[categoryField] || 'Other')
    breakdown[category] = (breakdown[category] || 0) + Number(transaction.amount || 0)
  })
  
  return Object.entries(breakdown).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? (amount / total) * 100 : 0
  }))
}

function calculateTrend(transactions: any[], amountField: string, startDate: Date, endDate: Date) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const trend: Array<{ date: string; revenue: number; expenses: number }> = []
  
  days.forEach(day => {
    const dayTransactions = transactions.filter(t => {
      const dateValue = t.transaction_date
      if (!dateValue) return false
      return format(new Date(dateValue), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    }
    )
    
    const total = dayTransactions.reduce((sum, t) => sum + Number(t[amountField] || 0), 0)
    if (transactions[0]?.transaction_type === 'income') {
      trend.push({ date: format(day, 'yyyy-MM-dd'), revenue: total, expenses: 0 })
    } else {
      trend.push({ date: format(day, 'yyyy-MM-dd'), revenue: 0, expenses: total })
    }
  })
  
  return trend
}

function calculateCashFlow(transactions: FinancialTransaction[], startDate: Date, endDate: Date) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  return days.map(day => {
    const dayTransactions = transactions.filter(t => 
      format(new Date(t.transaction_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    
    const inflow = dayTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const outflow = dayTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      date: format(day, 'yyyy-MM-dd'),
      inflow,
      outflow,
      net: inflow - outflow
    }
  })
}

// Tax calculations
export async function calculateTaxInfo(startDate: Date, endDate: Date): Promise<TaxInfo> {
  const transactions = await getFinancialTransactions({ start_date: startDate, end_date: endDate })
  
  // Calculate sales tax collected (from revenue)
  const revenue = transactions.filter(t => t.transaction_type === 'income')
  const taxCollected = revenue.reduce((sum, t) => {
    // Assume 8.5% sales tax rate - this should be configurable
    const taxRate = 0.085
    return sum + (t.amount * taxRate)
  }, 0)
  
  // Calculate tax paid (from expenses)
  const expenses = transactions.filter(t => t.transaction_type === 'expense') as Expense[]
  const taxPaid = expenses.reduce((sum, t) => sum + (t.tax_amount || 0), 0)
  
  return {
    sales_tax_rate: 8.5, // This should be configurable
    tax_collected: taxCollected,
    tax_paid: taxPaid,
    tax_liability: taxCollected - taxPaid,
    tax_period: `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
  }
}

// Export for accountants
export async function exportForAccountants(startDate: Date, endDate: Date, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<AccountantExport> {
  const transactions = await getFinancialTransactions({ start_date: startDate, end_date: endDate })
  const period = await getFinancialPeriod(startDate, endDate)
  const taxInfo = await calculateTaxInfo(startDate, endDate)
  
  const revenue = transactions.filter(t => t.transaction_type === 'income')
  const expenses = transactions.filter(t => t.transaction_type === 'expense')
  
  const revenueCategories = calculateCategoryBreakdown(revenue, 'category')
  const expenseCategories = calculateCategoryBreakdown(expenses, 'category')
  
  return {
    transactions,
    summary: {
      total_revenue: period.total_revenue,
      total_expenses: period.total_expenses,
      net_profit: period.net_profit,
      transaction_count: period.transaction_count,
      period
    },
    tax_summary: {
      sales_tax_collected: taxInfo.tax_collected,
      sales_tax_paid: taxInfo.tax_paid,
      net_tax_liability: taxInfo.tax_liability
    },
    categories: {
      revenue: revenueCategories.map(item => ({ category: item.category, amount: item.amount })),
      expenses: expenseCategories.map(item => ({ category: item.category, amount: item.amount }))
    },
    export_date: new Date(),
    format
  }
}

// Payment processing
export async function createPaymentTransaction(payment: Omit<PaymentTransaction, 'id' | 'created_at'>): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert([{
      booking_id: payment.booking_id,
      customer_id: payment.customer_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      transaction_id: payment.transaction_id,
      processor_fee: payment.processor_fee
    }])
    .select()
    .single()

  if (error) throw error
  return data as PaymentTransaction
}

export async function updatePaymentStatus(id: string, status: PaymentTransaction['status']): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .update({ 
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PaymentTransaction
}

// Utility functions
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  if (currency === 'EUR') {
    const fixedAmount = Number(amount).toFixed(2)
    return `€${fixedAmount}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function calculateTaxAmount(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

export function calculateNetAmount(amount: number, taxRate: number): number {
  return amount / (1 + (taxRate / 100))
} 