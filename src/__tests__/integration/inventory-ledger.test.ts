import type { SupabaseClient } from '@supabase/supabase-js'
import { applyPurchaseOrderReceive } from '@/lib/operations/procurement'
import { commitStocktake } from '@/lib/operations/stocktakes'
import { depleteRecipeForOrderItem } from '@/lib/operations/recipes'
import { summarizeStocktakeVariance } from '@/lib/operations/inventory-variance'
import { applyInventoryWasteToStockAndLedger } from '@/lib/operations/inventory-waste-ledger'

describe('inventory ledger helpers', () => {
  it('summarizes variance rows and tags severity', () => {
    const rows = [
      {
        id: '1',
        inventory_id: 'i1',
        counted_quantity: 0,
        expected_quantity: 10,
        variance: -10,
        counted_at: '2026-01-01',
      },
      {
        id: '2',
        inventory_id: 'i2',
        counted_quantity: 3,
        expected_quantity: 5,
        variance: -2,
        counted_at: '2026-01-02',
      },
    ]
    const out = summarizeStocktakeVariance(rows)
    expect(out).toHaveLength(2)
    expect(out[0].severity).toBe('high')
    expect(out[1].severity).toBe('low')
  })

  it('applyPurchaseOrderReceive increments stock and received_quantity', async () => {
    const poi = {
      id: 'poi1',
      purchase_order_id: 'po1',
      inventory_id: 'inv1',
      ordered_quantity: 10,
      received_quantity: 0,
    }
    const inv: Record<string, { id: string; current_stock: number }> = { inv1: { id: 'inv1', current_stock: 4 } }
    const client = {
      from: (table: string) => {
        if (table === 'purchase_order_items') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({ data: poi, error: null }),
                }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async () => {
                Object.assign(poi, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: inv[String(poi.inventory_id)], error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async (_c: string, id: unknown) => {
                const row = inv[String(id)]
                if (row) Object.assign(row, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: async () => ({ error: null }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await applyPurchaseOrderReceive({
      supabase: client,
      purchaseOrderId: 'po1',
      lines: [{ purchase_order_item_id: 'poi1', quantity_received: 3 }],
      allowOverfill: false,
      actorProfileId: 'actor',
    })

    expect(inv.inv1.current_stock).toBe(7)
    expect(poi.received_quantity).toBe(3)
  })

  it('commitStocktake sets counted level and marks committed', async () => {
    const st = {
      id: 'st1',
      inventory_id: 'inv1',
      counted_quantity: 12,
      expected_quantity: 10,
      status: 'counted' as const,
    }
    const inv: Record<string, { id: string; current_stock: number }> = { inv1: { id: 'inv1', current_stock: 20 } }
    const client = {
      from: (table: string) => {
        if (table === 'stocktakes') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { ...st }, error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async () => {
                Object.assign(st, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: inv.inv1, error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async (_c: string, id: unknown) => {
                const row = inv[String(id)]
                if (row) Object.assign(row, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: async () => ({ error: null }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await commitStocktake({ supabase: client, stocktakeId: 'st1', actorProfileId: 'a1' })
    expect(inv.inv1.current_stock).toBe(12)
    expect(st.status).toBe('committed')
  })

  it('depleteRecipeForOrderItem depletes ingredients and logs movements', async () => {
    const inv: Record<string, { id: string; current_stock: number }> = {
      gin: { id: 'gin', current_stock: 20 },
    }
    const client = {
      from: (table: string) => {
        if (table === 'recipes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'rec1' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'recipe_ingredients') {
          return {
            select: () => ({
              eq: async () => ({
                data: [{ inventory_id: 'gin', units_per_sale: 1.5 }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: inv.gin, error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async (_c: string, id: unknown) => {
                const row = inv[String(id)]
                if (row) Object.assign(row, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: async () => ({ error: null }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    const used = await depleteRecipeForOrderItem({
      supabase: client,
      menuItemId: 'menu-1',
      quantitySold: 2,
      orderId: 'ord1',
    })
    expect(used).toBe(true)
    expect(inv.gin.current_stock).toBe(17)
  })

  it('applyPurchaseOrderReceive returns early when lines array is empty', async () => {
    const client = {
      from: () => {
        throw new Error('from() should not run')
      },
    } as unknown as SupabaseClient
    await applyPurchaseOrderReceive({
      supabase: client,
      purchaseOrderId: 'po1',
      lines: [],
      allowOverfill: false,
    })
  })

  it('depleteRecipeForOrderItem returns false when quantity is zero', async () => {
    const client = { from: () => ({}) } as unknown as SupabaseClient
    const used = await depleteRecipeForOrderItem({
      supabase: client,
      menuItemId: 'm1',
      quantitySold: 0,
      orderId: 'o1',
    })
    expect(used).toBe(false)
  })

  it('applyPurchaseOrderReceive rejects negative quantity', async () => {
    const client = { from: () => ({}) } as unknown as SupabaseClient
    await expect(
      applyPurchaseOrderReceive({
        supabase: client,
        purchaseOrderId: 'po1',
        lines: [{ purchase_order_item_id: 'x', quantity_received: -1 }],
        allowOverfill: false,
      })
    ).rejects.toThrow('non-negative')
  })

  it('applyPurchaseOrderReceive skips lines with zero delta when already received', async () => {
    const poi = {
      id: 'poi1',
      purchase_order_id: 'po1',
      inventory_id: 'inv1',
      ordered_quantity: 5,
      received_quantity: 5,
    }
    const inv: Record<string, { id: string; current_stock: number }> = { inv1: { id: 'inv1', current_stock: 9 } }
    let movementInserts = 0
    const client = {
      from: (table: string) => {
        if (table === 'purchase_order_items') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({ data: poi, error: null }),
                }),
              }),
            }),
            update: () => ({ eq: async () => ({ error: null }) }),
          }
        }
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: inv.inv1, error: null }),
              }),
            }),
            update: () => ({ eq: async () => ({ error: null }) }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: async () => {
              movementInserts += 1
              return { error: null }
            },
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await applyPurchaseOrderReceive({
      supabase: client,
      purchaseOrderId: 'po1',
      lines: [{ purchase_order_item_id: 'poi1', quantity_received: 1 }],
      allowOverfill: false,
    })
    expect(movementInserts).toBe(0)
    expect(inv.inv1.current_stock).toBe(9)
  })

  it('commitStocktake rejects non-counted status', async () => {
    const client = {
      from: (table: string) => {
        if (table === 'stocktakes') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: 'st1',
                    inventory_id: 'inv1',
                    counted_quantity: 1,
                    expected_quantity: 1,
                    status: 'draft',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await expect(commitStocktake({ supabase: client, stocktakeId: 'st1' })).rejects.toThrow('Only counted')
  })

  it('applyPurchaseOrderReceive allows overfill when enabled', async () => {
    const poi = {
      id: 'poi1',
      purchase_order_id: 'po1',
      inventory_id: 'inv1',
      ordered_quantity: 5,
      received_quantity: 5,
    }
    const inv: Record<string, { id: string; current_stock: number }> = { inv1: { id: 'inv1', current_stock: 1 } }
    const client = {
      from: (table: string) => {
        if (table === 'purchase_order_items') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({ data: poi, error: null }),
                }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async () => {
                Object.assign(poi, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: inv.inv1, error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async (_c: string, id: unknown) => {
                const row = inv[String(id)]
                if (row) Object.assign(row, patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: async () => ({ error: null }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await applyPurchaseOrderReceive({
      supabase: client,
      purchaseOrderId: 'po1',
      lines: [{ purchase_order_item_id: 'poi1', quantity_received: 3 }],
      allowOverfill: true,
    })
    expect(poi.received_quantity).toBe(8)
    expect(inv.inv1.current_stock).toBe(4)
  })

  it('depleteRecipeForOrderItem returns false when recipe has no ingredients', async () => {
    const client = {
      from: (table: string) => {
        if (table === 'recipes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'rec1' }, error: null }),
              }),
            }),
          }
        }
        if (table === 'recipe_ingredients') {
          return {
            select: () => ({
              eq: async () => ({ data: [], error: null }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    const used = await depleteRecipeForOrderItem({
      supabase: client,
      menuItemId: 'm1',
      quantitySold: 1,
      orderId: 'o1',
    })
    expect(used).toBe(false)
  })

  it('depleteRecipeForOrderItem returns false when no recipe', async () => {
    const client = {
      from: (table: string) => {
        if (table === 'recipes') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    const used = await depleteRecipeForOrderItem({
      supabase: client,
      menuItemId: 'orphan',
      quantitySold: 1,
      orderId: 'o1',
    })
    expect(used).toBe(false)
  })

  it('applyInventoryWasteToStockAndLedger decrements stock and appends waste movement', async () => {
    const inv: Record<string, { current_stock: number }> = { inv1: { current_stock: 10 } }
    let inserted: Record<string, unknown> | null = null
    const client = {
      from: (table: string) => {
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { current_stock: inv.inv1.current_stock }, error: null }),
              }),
            }),
            update: (patch: Record<string, unknown>) => ({
              eq: async (_c: string, id: string) => {
                if (inv[id]) Object.assign(inv[id], patch)
                return { error: null }
              },
            }),
          }
        }
        if (table === 'stock_movements') {
          return {
            insert: (row: Record<string, unknown>) => {
              inserted = row
              return { error: null }
            },
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as unknown as SupabaseClient

    await applyInventoryWasteToStockAndLedger({
      supabase: client,
      wasteRowId: '00000000-0000-0000-0000-000000000001',
      inventoryId: 'inv1',
      quantity: 3,
      reason: 'spillage',
      actorProfileId: 'actor',
    })
    expect(inv.inv1.current_stock).toBe(7)
    const row = inserted as Record<string, unknown> | null
    expect(row?.quantity_delta).toBe(-3)
    expect(row?.movement_type).toBe('waste')
  })

  it('applyInventoryWasteToStockAndLedger propagates inventory read errors', async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'read failed' } }),
          }),
        }),
      }),
    } as unknown as SupabaseClient
    await expect(
      applyInventoryWasteToStockAndLedger({
        supabase: client,
        wasteRowId: '00000000-0000-0000-0000-000000000003',
        inventoryId: 'inv1',
        quantity: 1,
        reason: 'test',
      })
    ).rejects.toEqual({ message: 'read failed' })
  })

  it('applyInventoryWasteToStockAndLedger no-ops on non-positive quantity', async () => {
    const client = {
      from: () => {
        throw new Error('should not query')
      },
    } as unknown as SupabaseClient
    await applyInventoryWasteToStockAndLedger({
      supabase: client,
      wasteRowId: '00000000-0000-0000-0000-000000000002',
      inventoryId: 'inv1',
      quantity: 0,
      reason: 'n/a',
    })
  })

  it('summarizeStocktakeVariance drops zero-variance rows', () => {
    const out = summarizeStocktakeVariance([
      {
        id: 'z',
        inventory_id: 'i',
        counted_quantity: 5,
        expected_quantity: 5,
        variance: 0,
        counted_at: 't',
      },
    ])
    expect(out).toHaveLength(0)
  })
})
