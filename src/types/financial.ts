// Financial transaction types
export interface FinancialTransaction {
  id: string
  transaction_type: 'income' | 'expense' | 'refund' | 'adjustment'
  category: string
  amount: number
  description: string
  transaction_date: Date
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other'
  reference?: string
  created_at: Date
  updated_at: Date
  /** Revenue attribution (DB column `source`, public.financial_transactions). */
  source?: string | null
  customer_id?: string | null
  booking_id?: string | null
  event_id?: string | null
  supplier?: string | null
  invoice_number?: string | null
  tax_amount?: number | null
}

// Revenue types
export interface Revenue extends FinancialTransaction {
  transaction_type: 'income'
  source: 'food' | 'drinks' | 'events' | 'catering' | 'other'
  customer_id?: string
  booking_id?: string
  event_id?: string
}

// Expense types
export interface Expense extends FinancialTransaction {
  transaction_type: 'expense'
  category: 'inventory' | 'staff' | 'utilities' | 'rent' | 'marketing' | 'maintenance' | 'other'
  supplier?: string
  invoice_number?: string
  tax_amount?: number
}

// Financial period (daily, weekly, monthly, yearly)
export interface FinancialPeriod {
  start_date: Date
  end_date: Date
  total_revenue: number
  total_expenses: number
  net_profit: number
  gross_profit: number
  profit_margin: number
  transaction_count: number
}

// Financial analytics
export interface FinancialAnalytics {
  // Period summaries
  current_period: FinancialPeriod
  previous_period: FinancialPeriod
  year_to_date: FinancialPeriod
  
  // Revenue breakdown
  revenue_by_category: { category: string; amount: number; percentage: number }[]
  revenue_by_source: { source: string; amount: number; percentage: number }[]
  revenue_trend: { date: string; revenue: number }[]
  
  // Expense breakdown
  expenses_by_category: { category: string; amount: number; percentage: number }[]
  expenses_trend: { date: string; expenses: number }[]
  
  // Profit analysis
  profit_trend: { date: string; profit: number }[]
  profit_margin_trend: { date: string; margin: number }[]
  
  // Cash flow
  cash_flow: { date: string; inflow: number; outflow: number; net: number }[]
  
  // Key metrics
  average_transaction_value: number
  top_revenue_sources: { source: string; amount: number }[]
  top_expense_categories: { category: string; amount: number }[]
  
  // Tax information
  total_tax_collected: number
  total_tax_paid: number
  net_tax_liability: number
}

// Tax calculation and reporting
export interface TaxInfo {
  sales_tax_rate: number
  tax_collected: number
  tax_paid: number
  tax_liability: number
  tax_period: string
  tax_filing_date?: Date
}

// Financial settings
export interface FinancialSettings {
  currency: string
  tax_rate: number
  fiscal_year_start: Date
  reporting_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  auto_categorization: boolean
  expense_categories: string[]
  revenue_sources: string[]
}

// Budget planning
export interface Budget {
  id: string
  name: string
  period: 'monthly' | 'quarterly' | 'yearly'
  start_date: Date
  end_date: Date
  categories: BudgetCategory[]
  created_at: Date
  updated_at: Date
}

export interface BudgetCategory {
  category: string
  budgeted_amount: number
  actual_amount: number
  variance: number
  variance_percentage: number
}

// Financial reports
export interface FinancialReport {
  id: string
  type: 'profit_loss' | 'cash_flow' | 'balance_sheet' | 'tax_summary'
  period: FinancialPeriod
  generated_at: Date
  data: any
  exported_at?: Date
}

// Payment processing
export interface PaymentTransaction {
  id: string
  booking_id?: string
  customer_id?: string
  amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id?: string
  processor_fee?: number
  created_at: Date
  completed_at?: Date
}

// Financial filters for queries
export interface FinancialFilters {
  start_date?: Date
  end_date?: Date
  transaction_type?: FinancialTransaction['transaction_type']
  category?: string
  payment_method?: string
  min_amount?: number
  max_amount?: number
  search?: string
}

// Export data for accountants
export interface AccountantExport {
  transactions: FinancialTransaction[]
  summary: {
    total_revenue: number
    total_expenses: number
    net_profit: number
    transaction_count: number
    period: FinancialPeriod
  }
  tax_summary: {
    sales_tax_collected: number
    sales_tax_paid: number
    net_tax_liability: number
  }
  categories: {
    revenue: { category: string; amount: number }[]
    expenses: { category: string; amount: number }[]
  }
  export_date: Date
  format: 'csv' | 'xlsx' | 'pdf'
} 