import type {
  OrderStatus,
  PaymentLifecycleStatus,
  OrderTransitionContext,
  PaymentTransitionContext,
} from '@/types/operations'

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  open: ['active', 'closed', 'voided'],
  active: ['closed', 'voided'],
  closed: [],
  voided: [],
}

const paymentTransitions: Record<PaymentLifecycleStatus, PaymentLifecycleStatus[]> = {
  authorized: ['captured', 'refunded', 'chargeback'],
  captured: ['refunded', 'chargeback'],
  refunded: [],
  chargeback: [],
}

export function assertValidOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
  context: OrderTransitionContext
): void {
  if (!orderTransitions[from].includes(to)) {
    throw new Error(`Invalid order transition ${from} -> ${to}`)
  }

  if ((to === 'voided' || to === 'closed') && !context.reason) {
    throw new Error('Transition requires reason for auditability')
  }
}

export function assertValidPaymentTransition(
  from: PaymentLifecycleStatus,
  to: PaymentLifecycleStatus,
  context: PaymentTransitionContext
): void {
  if (!paymentTransitions[from].includes(to)) {
    throw new Error(`Invalid payment transition ${from} -> ${to}`)
  }

  if ((to === 'refunded' || to === 'chargeback') && !context.reason) {
    throw new Error('Refund and chargeback require reason')
  }
}

