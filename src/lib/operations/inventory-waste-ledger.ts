import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * After an `inventory_waste` row exists, decrement on-hand stock and append a ledger row (Track 4.5).
 */
export async function applyInventoryWasteToStockAndLedger(params: {
  supabase: SupabaseClient
  wasteRowId: string
  inventoryId: string
  quantity: number
  reason: string
  actorProfileId?: string
}): Promise<void> {
  const { supabase, wasteRowId, inventoryId, quantity, reason, actorProfileId } = params
  if (quantity <= 0) return

  const { data: inv, error: iErr } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('id', inventoryId)
    .single()
  if (iErr) throw iErr
  const prev = Number(inv?.current_stock ?? 0)
  const next = Math.max(0, prev - quantity)

  const { error: uErr } = await supabase.from('inventory').update({ current_stock: next }).eq('id', inventoryId)
  if (uErr) throw uErr

  const { error: mErr } = await supabase.from('stock_movements').insert({
    inventory_id: inventoryId,
    quantity_delta: -quantity,
    movement_type: 'waste',
    reference_type: 'inventory_waste',
    reference_id: wasteRowId,
    metadata: { reason },
    created_by: actorProfileId ?? null,
  })
  if (mErr) throw mErr
}
