export type SplitLineInput = { orderItemId: string; lineTotal: number }

/**
 * Proportional split of a payment across line items (Track 3.3).
 * Last line absorbs rounding remainder so the sum equals `paymentAmount`.
 */
export function allocateProportionalSplit(params: {
  lines: SplitLineInput[]
  paymentAmount: number
}): Array<{ order_item_id: string; allocated_amount: number }> {
  const { lines, paymentAmount } = params
  if (paymentAmount < 0) throw new Error('paymentAmount must be non-negative')
  if (!lines.length) throw new Error('At least one line is required')

  const total = lines.reduce((s, l) => s + l.lineTotal, 0)
  if (total <= 0) throw new Error('Sum of line totals must be positive')

  let allocated = 0
  return lines.map((row, index) => {
    const isLast = index === lines.length - 1
    const share = isLast
      ? Number((paymentAmount - allocated).toFixed(2))
      : Number(((paymentAmount * row.lineTotal) / total).toFixed(2))
    allocated += share
    return { order_item_id: row.orderItemId, allocated_amount: share }
  })
}
