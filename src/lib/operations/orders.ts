import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { assertValidOrderTransition } from './state-machine'
import type { OrderStatus } from '@/types/operations'
import { appendOrderEvent } from './order-events'
import { depleteRecipeForOrderItem } from './recipes'
import { assertOrderAgeComplianceForClose } from '@/lib/operations/order-age-sale'

export { transitionPaymentStatus } from './payments'

export async function transitionOrderStatus(params: {
  orderId: string
  from: OrderStatus
  to: OrderStatus
  reason: string
  actorProfileId: string
}) {
  assertValidOrderTransition(params.from, params.to, {
    reason: params.reason,
    actorProfileId: params.actorProfileId,
  })

  const supabase = await createServiceRoleClient()
  const { data: current, error: readErr } = await supabase
    .from('orders')
    .select('version')
    .eq('id', params.orderId)
    .single()
  if (readErr) throw readErr

  if (params.to === 'closed') {
    const age = await assertOrderAgeComplianceForClose({ supabase, orderId: params.orderId })
    if (!age.ok) throw new Error(age.message)
  }

  const v = Number(current?.version ?? 0)
  const update: Record<string, unknown> = {
    status: params.to,
    version: v + 1,
  }
  if (params.to === 'closed') update.closed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', params.orderId)
    .eq('status', params.from)
    .eq('version', v)
    .select()
    .single()

  if (error) throw error

  await appendOrderEvent(supabase, {
    orderId: params.orderId,
    eventType: 'order_status_changed',
    payload: {
      from: params.from,
      to: params.to,
      reason: params.reason,
    },
    actorProfileId: params.actorProfileId,
  })

  if (params.to === 'closed') {
    const { data: items } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity')
      .eq('order_id', params.orderId)

    for (const item of items || []) {
      if (!item.menu_item_id) continue
      const usedRecipe = await depleteRecipeForOrderItem({
        supabase,
        menuItemId: String(item.menu_item_id),
        quantitySold: Number(item.quantity || 0),
        orderId: params.orderId,
      })
      if (usedRecipe) continue

      const { data: inventory } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('id', item.menu_item_id)
        .single()
      if (!inventory) continue
      const newStock = Math.max(0, Number(inventory.current_stock) - Number(item.quantity || 0))
      await supabase.from('inventory').update({ current_stock: newStock }).eq('id', item.menu_item_id)
    }
  }

  return data
}
