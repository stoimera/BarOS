import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { assertValidPaymentTransition } from './state-machine'
import type { PaymentLifecycleStatus } from '@/types/operations'
import { appendOrderEvent } from './order-events'

export async function transitionPaymentStatus(params: {
  paymentId: string
  from: PaymentLifecycleStatus
  to: PaymentLifecycleStatus
  reason: string
  actorProfileId: string
  processorReference?: string
}) {
  assertValidPaymentTransition(params.from, params.to, {
    reason: params.reason,
    actorProfileId: params.actorProfileId,
    processorReference: params.processorReference,
  })

  const supabase = await createServiceRoleClient()
  const { data: current, error: readErr } = await supabase
    .from('payment_transactions')
    .select('id, order_id, version')
    .eq('id', params.paymentId)
    .single()
  if (readErr) throw readErr

  const v = Number(current?.version ?? 0)
  const legacyStatus =
    params.to === 'captured' ? 'completed' : params.to === 'authorized' ? 'pending' : 'refunded'

  const { data, error } = await supabase
    .from('payment_transactions')
    .update({
      lifecycle_status: params.to,
      status: legacyStatus,
      reconciliation_status: params.to === 'captured' ? 'pending' : 'exception',
      version: v + 1,
    })
    .eq('id', params.paymentId)
    .eq('lifecycle_status', params.from)
    .eq('version', v)
    .select()
    .single()

  if (error) throw error

  if (current?.order_id) {
    await appendOrderEvent(supabase, {
      orderId: current.order_id,
      eventType: 'payment_lifecycle_changed',
      payload: {
        payment_id: params.paymentId,
        from: params.from,
        to: params.to,
        reason: params.reason,
        processor_reference: params.processorReference ?? null,
      },
      actorProfileId: params.actorProfileId,
    })
  }

  return data
}
