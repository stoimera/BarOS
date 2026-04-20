import { mapFinancialTransactionFromDb } from '@/lib/financial-map'

describe('mapFinancialTransactionFromDb', () => {
  it('maps canonical columns and contract-alignment extensions', () => {
    const row = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      transaction_type: 'income',
      category: 'sales',
      amount: 42.5,
      description: 'Test',
      transaction_date: '2026-01-15',
      payment_method: 'card',
      reference: 'REF-1',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      source: 'events',
      customer_id: 'c0000000-0000-4000-8000-000000000001',
      booking_id: null,
      event_id: 'e0000000-0000-4000-8000-000000000002',
      supplier: null,
      invoice_number: null,
      tax_amount: null,
    }

    const t = mapFinancialTransactionFromDb(row)
    expect(t.transaction_type).toBe('income')
    expect(t.amount).toBe(42.5)
    expect(t.source).toBe('events')
    expect(t.customer_id).toBe('c0000000-0000-4000-8000-000000000001')
    expect(t.event_id).toBe('e0000000-0000-4000-8000-000000000002')
    expect(t.transaction_date.toISOString().slice(0, 10)).toBe('2026-01-15')
  })
})
