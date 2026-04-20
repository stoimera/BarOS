export type OrderStatus = 'open' | 'active' | 'closed' | 'voided'
export type PaymentLifecycleStatus = 'authorized' | 'captured' | 'refunded' | 'chargeback'
export type ReconciliationStatus = 'pending' | 'matched' | 'exception'

export type OperationsPermission =
  | 'orders.read'
  | 'orders.write'
  | 'orders.settle'
  | 'inventory.read'
  | 'inventory.write'
  | 'procurement.read'
  | 'procurement.write'
  | 'staff_time.read'
  | 'staff_time.write'
  | 'event_commerce.read'
  | 'event_commerce.write'
  | 'locations.read'
  | 'locations.write'
  | 'compliance.read'
  | 'compliance.write'

export interface OrderTransitionContext {
  reason?: string
  actorProfileId: string
}

export interface PaymentTransitionContext {
  reason?: string
  actorProfileId: string
  processorReference?: string
}

