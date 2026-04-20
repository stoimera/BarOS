import type { SupabaseClient } from '@supabase/supabase-js'

/** Counts open POS orders per venue table (Track 10.1 — capacity / conflict hints). */
export async function countOpenOrdersByTableId(
  supabase: SupabaseClient,
  tableIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (tableIds.length === 0) return out

  const { data, error } = await supabase
    .from('orders')
    .select('table_id')
    .eq('status', 'open')
    .in('table_id', tableIds)

  if (error) throw error

  for (const row of data || []) {
    const tid = row.table_id as string | null | undefined
    if (!tid) continue
    out.set(tid, (out.get(tid) ?? 0) + 1)
  }

  return out
}
