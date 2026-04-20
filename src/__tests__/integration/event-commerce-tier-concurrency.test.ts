/**
 * @jest-environment node
 */

describe('event ticket tier optimistic concurrency (Track 6.7)', () => {
  it('models reserve failure when inventory_count no longer matches', () => {
    let inventory = 2
    let reserved = 0
    const tryReserve = (expectedInv: number, qty: number) => {
      if (inventory !== expectedInv || inventory < qty) return { ok: false as const }
      inventory -= qty
      reserved += qty
      return { ok: true as const, inventory, reserved }
    }

    expect(tryReserve(2, 1).ok).toBe(true)
    expect(tryReserve(2, 1).ok).toBe(false)
    expect(inventory).toBe(1)
    expect(reserved).toBe(1)
  })
})
