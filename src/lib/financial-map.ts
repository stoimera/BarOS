import type { FinancialTransaction } from '@/types/financial'

export function mapFinancialTransactionFromDb(row: Record<string, unknown>): FinancialTransaction {
  const rawDate = row.transaction_date
  const transaction_date =
    rawDate instanceof Date ? rawDate : typeof rawDate === 'string' ? new Date(rawDate) : new Date()

  return {
    id: String(row.id ?? ''),
    transaction_type: String(row.transaction_type ?? 'expense') as FinancialTransaction['transaction_type'],
    category: String(row.category ?? ''),
    amount: Number(row.amount ?? 0),
    description: String(row.description ?? ''),
    transaction_date,
    payment_method: row.payment_method as FinancialTransaction['payment_method'],
    reference: row.reference != null ? String(row.reference) : undefined,
    created_at: row.created_at ? new Date(String(row.created_at)) : new Date(),
    updated_at: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
    source: row.source != null ? String(row.source) : undefined,
    customer_id: row.customer_id != null ? String(row.customer_id) : undefined,
    booking_id: row.booking_id != null ? String(row.booking_id) : undefined,
    event_id: row.event_id != null ? String(row.event_id) : undefined,
    supplier: row.supplier != null ? String(row.supplier) : undefined,
    invoice_number: row.invoice_number != null ? String(row.invoice_number) : undefined,
    tax_amount: row.tax_amount != null ? Number(row.tax_amount) : undefined,
  }
}
