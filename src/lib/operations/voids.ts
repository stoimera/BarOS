/**
 * Canonical reason codes for void / refund style operations (audit + UI labels).
 */
export const ORDER_VOID_REASON_CODES = [
  'customer_cancelled',
  'staff_error',
  'inventory_unavailable',
  'payment_failed',
  'comp',
  'other',
] as const

export type OrderVoidReasonCode = (typeof ORDER_VOID_REASON_CODES)[number]

export function isOrderVoidReasonCode(value: string): value is OrderVoidReasonCode {
  return (ORDER_VOID_REASON_CODES as readonly string[]).includes(value)
}
