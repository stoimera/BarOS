export type StocktakeVarianceRow = {
  id: string
  inventory_id: string
  counted_quantity: number
  expected_quantity: number | null
  variance: number
  counted_at: string
  status?: string
}

/**
 * Surfaces non-zero physical count deltas for review (Track 4.7).
 */
export function summarizeStocktakeVariance(rows: StocktakeVarianceRow[]) {
  return rows
    .filter((r) => Number(r.variance) !== 0)
    .map((r) => ({
      id: r.id,
      inventory_id: r.inventory_id,
      variance: Number(r.variance),
      counted_quantity: r.counted_quantity,
      expected_quantity: r.expected_quantity,
      counted_at: r.counted_at,
      severity: Math.abs(Number(r.variance)) >= 10 ? ('high' as const) : ('low' as const),
    }))
}
