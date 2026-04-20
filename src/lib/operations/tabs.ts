import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { assertValidOrderTransition } from './state-machine'
import type { OrderStatus } from '@/types/operations'
import { appendOrderEvent } from './order-events'

export type TabStatus = OrderStatus

export async function transitionTabStatus(params: {
  tabId: string
  from: TabStatus
  to: TabStatus
  reason: string
  actorProfileId: string
}) {
  assertValidOrderTransition(params.from, params.to, {
    reason: params.reason,
    actorProfileId: params.actorProfileId,
  })

  const supabase = await createServiceRoleClient()
  const { data: current, error: readErr } = await supabase
    .from('tabs')
    .select('id, order_id, version')
    .eq('id', params.tabId)
    .single()
  if (readErr) throw readErr

  const v = Number(current?.version ?? 0)
  const update: Record<string, unknown> = { status: params.to, version: v + 1 }
  if (params.to === 'closed' || params.to === 'voided') {
    update.closed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tabs')
    .update(update)
    .eq('id', params.tabId)
    .eq('status', params.from)
    .eq('version', v)
    .select()
    .single()

  if (error) throw error

  if (current?.order_id) {
    await appendOrderEvent(supabase, {
      orderId: current.order_id,
      eventType: 'order_status_changed',
      payload: {
        kind: 'tab',
        tab_id: params.tabId,
        from: params.from,
        to: params.to,
        reason: params.reason,
      },
      actorProfileId: params.actorProfileId,
    })
  }

  return data
}
