import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Commit a counted stocktake: sets on-hand stock to counted level and appends ledger rows (Track 4.4).
 */
export async function commitStocktake(params: {
  supabase: SupabaseClient
  stocktakeId: string
  actorProfileId?: string
}): Promise<void> {
  const { supabase, stocktakeId, actorProfileId } = params

  const { data: row, error: rErr } = await supabase
    .from('stocktakes')
    .select('id, inventory_id, counted_quantity, expected_quantity, status')
    .eq('id', stocktakeId)
    .single()
  if (rErr) throw rErr
  if (!row) throw new Error('Stocktake not found')
  if (row.status !== 'counted') throw new Error('Only counted stocktakes can be committed')

  const { data: inv, error: iErr } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('id', row.inventory_id)
    .single()
  if (iErr) throw iErr

  const previous = Number(inv?.current_stock ?? 0)
  const counted = Number(row.counted_quantity)
  const delta = counted - previous

  const { error: uInv } = await supabase.from('inventory').update({ current_stock: counted }).eq('id', row.inventory_id)
  if (uInv) throw uInv

  const { error: mErr } = await supabase.from('stock_movements').insert({
    inventory_id: row.inventory_id,
    quantity_delta: delta,
    movement_type: 'stocktake_commit',
    reference_type: 'stocktake',
    reference_id: row.id,
    metadata: {
      previous_stock: previous,
      expected_quantity: row.expected_quantity,
    },
    created_by: actorProfileId ?? null,
  })
  if (mErr) throw mErr

  const { error: sErr } = await supabase
    .from('stocktakes')
    .update({ status: 'committed', committed_at: new Date().toISOString() })
    .eq('id', stocktakeId)
  if (sErr) throw sErr
}
