import type { SupabaseClient } from '@supabase/supabase-js'
import { appendOrderEvent } from './order-events'

export async function adjustOrderItemQuantity(params: {
  supabase: SupabaseClient
  orderId: string
  orderItemId: string
  quantity: number
  reason: string
  actorProfileId: string
}): Promise<{ item: Record<string, unknown>; subtotal: number }> {
  const { supabase, orderId, orderItemId, quantity, reason, actorProfileId } = params
  if (quantity < 1) throw new Error('Quantity must be at least 1')

  const { data: existing, error: exErr } = await supabase
    .from('order_items')
    .select('unit_price')
    .eq('id', orderItemId)
    .eq('order_id', orderId)
    .single()
  if (exErr) throw exErr
  if (!existing) throw new Error('Order item not found')

  const lineTotal = Number((quantity * Number((existing as { unit_price: number }).unit_price)).toFixed(2))

  const { data: updated, error } = await supabase
    .from('order_items')
    .update({
      quantity,
      line_total: lineTotal,
      adjustment_reason: reason,
      adjusted_at: new Date().toISOString(),
    })
    .eq('id', orderItemId)
    .select()
    .single()
  if (error) throw error

  const { data: orderItems } = await supabase.from('order_items').select('line_total').eq('order_id', orderId)
  const subtotal = (orderItems || []).reduce((sum, row) => sum + Number(row.line_total || 0), 0)
  await supabase.from('orders').update({ subtotal, total: subtotal }).eq('id', orderId)

  await appendOrderEvent(supabase, {
    orderId,
    eventType: 'order_item_adjusted',
    payload: {
      order_item_id: orderItemId,
      quantity,
      reason,
      line_total: lineTotal,
    },
    actorProfileId,
  })

  return { item: updated as Record<string, unknown>, subtotal }
}
