import type { SupabaseClient } from '@supabase/supabase-js'

export type ReceiveLineInput = {
  purchase_order_item_id: string
  quantity_received: number
}

/**
 * Apply receiving lines for a PO (Track 4.3). Increments inventory and records stock_movements.
 * When `allow_overfill` is false, each line caps at `ordered_quantity`.
 */
export async function applyPurchaseOrderReceive(params: {
  supabase: SupabaseClient
  purchaseOrderId: string
  lines: ReceiveLineInput[]
  allowOverfill: boolean
  actorProfileId?: string
}): Promise<void> {
  const { supabase, purchaseOrderId, lines, allowOverfill, actorProfileId } = params
  if (!lines.length) return

  for (const line of lines) {
    if (line.quantity_received < 0) throw new Error('quantity_received must be non-negative')

    const { data: row, error: rErr } = await supabase
      .from('purchase_order_items')
      .select('id, inventory_id, ordered_quantity, received_quantity')
      .eq('id', line.purchase_order_item_id)
      .eq('purchase_order_id', purchaseOrderId)
      .single()
    if (rErr) throw rErr
    if (!row) throw new Error('Unknown purchase order item')

    const ordered = Number(row.ordered_quantity)
    const prev = Number(row.received_quantity ?? 0)
    const nextRaw = prev + line.quantity_received
    const next = allowOverfill ? nextRaw : Math.min(ordered, nextRaw)
    const delta = next - prev
    if (delta === 0) continue

    const { data: inv, error: iErr } = await supabase
      .from('inventory')
      .select('current_stock')
      .eq('id', row.inventory_id)
      .single()
    if (iErr) throw iErr
    const prevStock = Number(inv?.current_stock ?? 0)
    const newStock = prevStock + delta

    const { error: uInv } = await supabase
      .from('inventory')
      .update({ current_stock: newStock })
      .eq('id', row.inventory_id)
    if (uInv) throw uInv

    const { error: uPoi } = await supabase
      .from('purchase_order_items')
      .update({ received_quantity: next })
      .eq('id', row.id)
    if (uPoi) throw uPoi

    const { error: mErr } = await supabase.from('stock_movements').insert({
      inventory_id: row.inventory_id,
      quantity_delta: delta,
      movement_type: 'purchase_receive',
      reference_type: 'purchase_order_item',
      reference_id: row.id,
      metadata: {
        purchase_order_id: purchaseOrderId,
        allow_overfill: allowOverfill,
        over_ordered: nextRaw > ordered,
      },
      created_by: actorProfileId ?? null,
    })
    if (mErr) throw mErr
  }
}
