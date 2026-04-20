import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderEventType =
  | 'order_status_changed'
  | 'order_item_added'
  | 'order_item_adjusted'
  | 'order_item_station'
  | 'payment_lifecycle_changed'

export async function appendOrderEvent(
  supabase: SupabaseClient,
  params: {
    orderId: string
    eventType: OrderEventType
    payload: Record<string, unknown>
    actorProfileId: string
  }
): Promise<void> {
  const { error } = await supabase.from('order_events').insert({
    order_id: params.orderId,
    event_type: params.eventType,
    payload: params.payload,
    actor_profile_id: params.actorProfileId,
  })
  if (error) throw error
}
