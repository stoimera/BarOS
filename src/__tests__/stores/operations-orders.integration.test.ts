jest.mock('@/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn(),
}))

import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { transitionOrderStatus, transitionPaymentStatus } from '@/lib/operations/orders'

type OrderRecord = {
  id: string
  status: 'open' | 'active' | 'closed' | 'voided'
  closed_at?: string
  version?: number
  customer_id?: string | null
}

type PaymentRecord = {
  id: string
  lifecycle_status: 'authorized' | 'captured' | 'refunded' | 'chargeback'
  reconciliation_status?: 'pending' | 'exception'
  status?: string
  version?: number
}

function makeSupabaseOrdersMock(options?: {
  orderItems?: Array<{ order_id: string; menu_item_id?: string | null; quantity: number }>
  inventory?: Record<string, { id: string; current_stock: number }>
  recipeByMenuItemId?: Record<
    string,
    { recipeId: string; ingredients: Array<{ inventory_id: string; units_per_sale: number }> }
  >
  menuMinAgeById?: Record<string, number>
}) {
  const orders: Record<string, OrderRecord> = {
    o1: { id: 'o1', status: 'active', version: 0 },
  }
  const payments: Record<string, PaymentRecord> = {
    p1: { id: 'p1', lifecycle_status: 'authorized', status: 'pending', version: 0 },
  }
  const inventory: Record<string, { id: string; current_stock: number }> = options?.inventory || {
    inv1: { id: 'inv1', current_stock: 10 },
  }
  const orderItems = options?.orderItems || [{ order_id: 'o1', menu_item_id: 'inv1', quantity: 3 }]
  const menuMinAgeById = options?.menuMinAgeById ?? {}

  const client = {
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: (columns?: string) => ({
            eq: (_col: string, id: unknown) => ({
              single: async () => {
                const order = orders[String(id)]
                if (!order) return { data: null, error: { message: 'not found' } }
                if (columns?.includes('customer_id')) {
                  return { data: { customer_id: order.customer_id ?? null }, error: null }
                }
                return { data: { version: order.version ?? 0 }, error: null }
              },
            }),
          }),
          update: (patch: Record<string, unknown>) => {
            const ctx = { patch, id: undefined as unknown, status: undefined as unknown, version: undefined as unknown }
            const chain = {
              eq(col: string, val: unknown) {
                if (col === 'id') ctx.id = val
                else if (col === 'status') ctx.status = val
                else if (col === 'version') ctx.version = val
                return chain
              },
              select: () => ({
                single: async () => {
                  const order = orders[String(ctx.id)]
                  if (
                    !order ||
                    order.status !== ctx.status ||
                    Number(order.version ?? 0) !== Number(ctx.version)
                  ) {
                    return { data: null, error: { message: 'not found' } }
                  }
                  Object.assign(order, ctx.patch)
                  return { data: order, error: null }
                },
              }),
            }
            return chain
          },
        }
      }

      if (table === 'order_events') {
        return {
          insert: () => ({ error: null }),
        }
      }

      if (table === 'order_items') {
        return {
          select: () => ({
            eq: async (_col: string, _orderId: unknown) => ({ data: orderItems, error: null }),
          }),
        }
      }

      if (table === 'menu_items') {
        return {
          select: () => ({
            in: async (_col: string, ids: unknown[]) => {
              const rows = (ids as string[]).map((id) => ({
                min_age: menuMinAgeById[id] ?? 0,
              }))
              return { data: rows, error: null }
            },
          }),
        }
      }

      if (table === 'customers') {
        return {
          select: () => ({
            eq: (_col: string, id: unknown) => ({
              single: async () => ({
                data: { date_of_birth: '1990-01-01' },
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'inventory') {
        return {
          select: () => ({
            eq: (_col: string, id: unknown) => ({
              single: async () => ({ data: inventory[String(id)] || null, error: null }),
            }),
          }),
          update: (patch: Record<string, unknown>) => ({
            eq: async (_col: string, id: unknown) => {
              const row = inventory[String(id)]
              if (row) Object.assign(row, patch)
              return { data: row || null, error: null }
            },
          }),
        }
      }

      if (table === 'recipes') {
        return {
          select: () => ({
            eq: (_col: string, menuItemId: unknown) => ({
              maybeSingle: async () => {
                const cfg = options?.recipeByMenuItemId?.[String(menuItemId)]
                return { data: cfg ? { id: cfg.recipeId } : null, error: null }
              },
            }),
          }),
        }
      }

      if (table === 'recipe_ingredients') {
        return {
          select: () => ({
            eq: async (_col: string, recipeId: unknown) => {
              const all = options?.recipeByMenuItemId
              const cfg = all && Object.values(all).find((c) => c.recipeId === String(recipeId))
              return { data: cfg?.ingredients || [], error: null }
            },
          }),
        }
      }

      if (table === 'stock_movements') {
        return {
          insert: () => ({ error: null }),
        }
      }

      if (table === 'payment_transactions') {
        return {
          select: () => ({
            eq: (_col: string, id: unknown) => ({
              single: async () => {
                const payment = payments[String(id)]
                if (!payment) return { data: null, error: { message: 'not found' } }
                return { data: { version: payment.version ?? 0, order_id: 'o1' }, error: null }
              },
            }),
          }),
          update: (patch: Record<string, unknown>) => {
            const ctx = { patch, id: undefined as unknown, from: undefined as unknown, version: undefined as unknown }
            const chain = {
              eq(col: string, val: unknown) {
                if (col === 'id') ctx.id = val
                else if (col === 'lifecycle_status') ctx.from = val
                else if (col === 'version') ctx.version = val
                return chain
              },
              select: () => ({
                single: async () => {
                  const payment = payments[String(ctx.id)]
                  if (
                    !payment ||
                    payment.lifecycle_status !== ctx.from ||
                    Number(payment.version ?? 0) !== Number(ctx.version)
                  ) {
                    return { data: null, error: { message: 'not found' } }
                  }
                  Object.assign(payment, ctx.patch)
                  return { data: payment, error: null }
                },
              }),
            }
            return chain
          },
        }
      }

      throw new Error(`Unsupported table mock: ${table}`)
    },
  }

  return { client, orders, payments, inventory }
}

describe('operations orders integration', () => {
  it('closes an order and decrements linked inventory stock', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    const result = await transitionOrderStatus({
      orderId: 'o1',
      from: 'active',
      to: 'closed',
      reason: 'bill settled',
      actorProfileId: 'actor-1',
    })

    expect(result.status).toBe('closed')
    expect(result.closed_at).toBeDefined()
    expect(mock.inventory.inv1.current_stock).toBe(7)
  })

  it('updates payment lifecycle and reconciliation status', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    const result = await transitionPaymentStatus({
      paymentId: 'p1',
      from: 'authorized',
      to: 'captured',
      reason: 'processor capture',
      actorProfileId: 'actor-1',
      processorReference: 'proc-123',
    })

    expect(result.lifecycle_status).toBe('captured')
    expect(result.reconciliation_status).toBe('pending')
  })

  it('marks reconciliation as exception for non-captured payment transitions', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    mock.payments.p1.lifecycle_status = 'captured'
    const result = await transitionPaymentStatus({
      paymentId: 'p1',
      from: 'captured',
      to: 'refunded',
      reason: 'customer request',
      actorProfileId: 'actor-1',
      processorReference: 'refund-123',
    })

    expect(result.lifecycle_status).toBe('refunded')
    expect(result.reconciliation_status).toBe('exception')
  })

  it('transitions to active without changing inventory', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    mock.orders.o1.status = 'open'
    const result = await transitionOrderStatus({
      orderId: 'o1',
      from: 'open',
      to: 'active',
      reason: 'service started',
      actorProfileId: 'actor-1',
    })

    expect(result.status).toBe('active')
    expect(mock.inventory.inv1.current_stock).toBe(10)
  })

  it('skips depletion for invalid order-items links', async () => {
    const mock = makeSupabaseOrdersMock({
      orderItems: [
        { order_id: 'o1', menu_item_id: null, quantity: 2 },
        { order_id: 'o1', menu_item_id: 'missing-inventory', quantity: 2 },
      ],
    })
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    const result = await transitionOrderStatus({
      orderId: 'o1',
      from: 'active',
      to: 'closed',
      reason: 'close with unmapped items',
      actorProfileId: 'actor-1',
    })

    expect(result.status).toBe('closed')
    expect(mock.inventory.inv1.current_stock).toBe(10)
  })

  it('rejects invalid transition before touching persistence', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    await expect(
      transitionOrderStatus({
        orderId: 'o1',
        from: 'closed',
        to: 'active',
        reason: 'invalid reopen',
        actorProfileId: 'actor-1',
      })
    ).rejects.toThrow('Invalid order transition closed -> active')
  })

  it('rejects close when age-restricted menu lines exist and order has no customer', async () => {
    const mock = makeSupabaseOrdersMock({
      menuMinAgeById: { inv1: 21 },
    })
    mock.orders.o1.customer_id = null
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    await expect(
      transitionOrderStatus({
        orderId: 'o1',
        from: 'active',
        to: 'closed',
        reason: 'settled',
        actorProfileId: 'actor-1',
      })
    ).rejects.toThrow(/customer_id/)
  })

  it('depletes recipe ingredients when closing an order with a BOM', async () => {
    const mock = makeSupabaseOrdersMock({
      orderItems: [{ order_id: 'o1', menu_item_id: 'm1', quantity: 2 }],
      inventory: {
        gin1: { id: 'gin1', current_stock: 50 },
      },
      recipeByMenuItemId: {
        m1: { recipeId: 'rec1', ingredients: [{ inventory_id: 'gin1', units_per_sale: 2 }] },
      },
    })
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    await transitionOrderStatus({
      orderId: 'o1',
      from: 'active',
      to: 'closed',
      reason: 'settled',
      actorProfileId: 'actor-1',
    })

    expect(mock.inventory.gin1.current_stock).toBe(46)
  })

  it('rejects a second close attempt after optimistic status mismatch', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)

    await transitionOrderStatus({
      orderId: 'o1',
      from: 'active',
      to: 'closed',
      reason: 'first close',
      actorProfileId: 'actor-1',
    })
    expect(mock.orders.o1.status).toBe('closed')

    await expect(
      transitionOrderStatus({
        orderId: 'o1',
        from: 'active',
        to: 'closed',
        reason: 'duplicate close',
        actorProfileId: 'actor-1',
      })
    ).rejects.toMatchObject({ message: 'not found' })
  })

  it('allows only one concurrent close when two transitions race the same version (3.12)', async () => {
    const mock = makeSupabaseOrdersMock()
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mock.client)
    const params = {
      orderId: 'o1',
      from: 'active' as const,
      to: 'closed' as const,
      reason: 'concurrent close',
      actorProfileId: 'actor-1',
    }
    const outcomes = await Promise.allSettled([
      transitionOrderStatus(params),
      transitionOrderStatus(params),
    ])
    const fulfilled = outcomes.filter((o) => o.status === 'fulfilled')
    expect(fulfilled).toHaveLength(1)
  })
})
