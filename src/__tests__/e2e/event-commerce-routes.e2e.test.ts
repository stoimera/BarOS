jest.mock('@/lib/security/api-middleware', () => ({
  withSecurity: (handler: unknown) => handler,
}))

jest.mock('@/lib/operations/idempotency', () => ({
  getOrExecuteIdempotent: async (
    _scope: string,
    _key: string | null | undefined,
    execute: () => Promise<{ status: number; body: unknown }>
  ) => {
    const r = await execute()
    return { replayed: false, status: r.status, body: r.body }
  },
}))

jest.mock('@/lib/operations/checkin-token', () => ({
  generateCheckinTokenPlaintext: () => 'plain-token-test',
  hashCheckinToken: (s: string) => `h(${s})`,
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/security/audit', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}))

import { createClient } from '@/utils/supabase/server'
import { GET as listTicketSales } from '@/app/api/operations/event-commerce/ticket-sales/route'
import { POST as createTicketSale } from '@/app/api/operations/event-commerce/ticket-sales/route'
import { PATCH as refundTicketSale } from '@/app/api/operations/event-commerce/ticket-sales/[id]/route'
import { POST as checkinTicketSale } from '@/app/api/operations/event-commerce/checkin/route'

type DbState = {
  tiers: Record<
    string,
    { id: string; inventory_count: number; price: number; event_id?: string; reserved_count?: number }
  >
  sales: Record<
    string,
    {
      id: string
      ticket_tier_id: string
      quantity: number
      status: string
      checkin_count: number
      fraud_flag?: boolean
      checkin_token_hash?: string
      purchase_source?: string
    }
  >
  promos: Record<
    string,
    {
      id: string
      code: string
      is_active: boolean
      redeemed_count: number
      max_redemptions: number
      discount_type: 'percentage' | 'fixed'
      discount_value: number
      event_id?: string | null
      starts_at?: string | null
      ends_at?: string | null
      max_uses_per_customer?: number | null
    }
  >
}

function makeSupabaseMock(state: DbState) {
  return {
    from: (table: string) => {
      const ctx: Record<string, unknown> = { table, eq: {} as Record<string, unknown>, updatePatch: null, insertRows: null }
      return {
        select: () => ({
          eq: (col: string, val: unknown) => {
            (ctx.eq as Record<string, unknown>)[col] = val
            return {
              eq: (col2: string, val2: unknown) => {
                (ctx.eq as Record<string, unknown>)[col2] = val2
                return {
                  single: async () => resolveSelectSingle(state, table, ctx.eq as Record<string, unknown>),
                  maybeSingle: async () => resolveSelectSingle(state, table, ctx.eq as Record<string, unknown>),
                }
              },
              single: async () => resolveSelectSingle(state, table, ctx.eq as Record<string, unknown>),
              maybeSingle: async () => resolveSelectSingle(state, table, ctx.eq as Record<string, unknown>),
            }
          },
          order: () => ({
            limit: async () => ({ data: Object.values(state.sales), error: null }),
          }),
        }),
        insert: (rows: Record<string, unknown>[]) => {
          ctx.insertRows = rows
          return {
            select: () => ({
              single: async () => resolveInsertSingle(state, table, rows),
            }),
          }
        },
        update: (patch: Record<string, unknown>) => {
          ctx.updatePatch = patch
          ;(ctx.eq as Record<string, unknown>) = {}
          const chain = {
            eq(col: string, val: unknown) {
              ;(ctx.eq as Record<string, unknown>)[col] = val
              return chain
            },
            select: () => ({
              single: async () => resolveUpdateSingle(state, table, patch, ctx.eq as Record<string, unknown>),
            }),
            single: async () => resolveUpdateSingle(state, table, patch, ctx.eq as Record<string, unknown>),
          }
          return chain
        },
      }
    },
  }
}

async function resolveSelectSingle(state: DbState, table: string, eq: Record<string, unknown>) {
  if (table === 'event_ticket_tiers') {
    const tier = state.tiers[String(eq.id)]
    return tier ? { data: tier, error: null } : { data: null, error: { message: 'not found' } }
  }
  if (table === 'promo_codes') {
    const promo = Object.values(state.promos).find((p) => p.code === eq.code && p.is_active === eq.is_active)
    return promo ? { data: promo, error: null } : { data: null, error: { message: 'not found' } }
  }
  if (table === 'event_ticket_sales') {
    if (eq.checkin_token_hash) {
      const sale = Object.values(state.sales).find((s) => s.checkin_token_hash === eq.checkin_token_hash)
      return { data: sale ?? null, error: null }
    }
    const sale = state.sales[String(eq.id)] || Object.values(state.sales).find((s) => s.id === eq.id)
    return sale ? { data: sale, error: null } : { data: null, error: { message: 'not found' } }
  }
  return { data: null, error: { message: 'unsupported table' } }
}

async function resolveInsertSingle(state: DbState, table: string, rows: Record<string, unknown>[]) {
  if (table !== 'event_ticket_sales') return { data: null, error: { message: 'unsupported insert' } }
  const row = rows[0]
  const id = `sale-${Object.keys(state.sales).length + 1}`
  const created = {
    id,
    ticket_tier_id: String(row.ticket_tier_id),
    quantity: Number(row.quantity),
    status: String(row.status || 'paid'),
    checkin_count: 0,
    fraud_flag: false,
    promo_code_id: (row.promo_code_id as string | null) || null,
    discount_amount: Number(row.discount_amount || 0),
    total_amount: Number(row.total_amount || 0),
    purchase_source: String(row.purchase_source || 'inventory'),
  }
  state.sales[id] = created
  return { data: created, error: null }
}

async function resolveUpdateSingle(state: DbState, table: string, patch: Record<string, unknown>, eq: Record<string, unknown>) {
  if (table === 'event_ticket_tiers') {
    const tier = state.tiers[String(eq.id)]
    if (!tier) return { data: null, error: { message: 'not found' } }
    Object.assign(tier, patch)
    return { data: tier, error: null }
  }
  if (table === 'event_ticket_sales') {
    const sale = state.sales[String(eq.id)]
    if (!sale) return { data: null, error: { message: 'not found' } }
    Object.assign(sale, patch)
    return { data: sale, error: null }
  }
  if (table === 'promo_codes') {
    const promo = state.promos[String(eq.id)]
    if (!promo) return { data: null, error: { message: 'not found' } }
    Object.assign(promo, patch)
    return { data: promo, error: null }
  }
  return { data: null, error: { message: 'unsupported update' } }
}

function postReq() {
  return {
    headers: {
      get: (_name: string) => null,
    },
  } as unknown as Request
}

const testUser = { id: 'user-1', role: 'staff', profileId: 'profile-1' }

describe('event commerce route-level verification', () => {
  it('lists ticket sales from the route', async () => {
    const state: DbState = {
      tiers: {},
      sales: {
        sale1: { id: 'sale1', ticket_tier_id: 'tier1', quantity: 1, status: 'paid', checkin_count: 0 },
      },
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (listTicketSales as unknown as () => Promise<Response>)()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].id).toBe('sale1')
  })

  it('rejects ticket sale when inventory is insufficient', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 1, price: 20 } },
      sales: {},
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (createTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_tier_id: 'tier1', quantity: 2, purchase_source: 'inventory' } }
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Insufficient ticket inventory/)
  })

  it('creates ticket sale and decrements inventory', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 5, price: 30 } },
      sales: {},
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (createTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_tier_id: 'tier1', quantity: 2, purchase_source: 'inventory' } }
    )
    expect(res.status).toBe(200)
    expect(state.tiers.tier1.inventory_count).toBe(3)
  })

  it('applies percentage promo code discount and increments promo usage', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 5, price: 50 } },
      sales: {},
      promos: {
        p1: {
          id: 'p1',
          code: 'VIP20',
          is_active: true,
          redeemed_count: 0,
          max_redemptions: 2,
          discount_type: 'percentage',
          discount_value: 20,
        },
      },
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (createTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_tier_id: 'tier1', quantity: 2, promo_code: 'VIP20' } }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.discount_amount).toBe(20)
    expect(json.data.total_amount).toBe(80)
    expect(json.data.promo_code_id).toBe('p1')
    expect(state.promos.p1.redeemed_count).toBe(1)
  })

  it('ignores promo code when max redemptions is reached', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 3, price: 30 } },
      sales: {},
      promos: {
        p1: {
          id: 'p1',
          code: 'FULL',
          is_active: true,
          redeemed_count: 2,
          max_redemptions: 2,
          discount_type: 'fixed',
          discount_value: 5,
        },
      },
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (createTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_tier_id: 'tier1', quantity: 1, promo_code: 'FULL' } }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.discount_amount).toBe(0)
    expect(json.data.total_amount).toBe(30)
    expect(state.promos.p1.redeemed_count).toBe(2)
  })

  it('refunds sale and restores inventory', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 2, price: 30 } },
      sales: { sale1: { id: 'sale1', ticket_tier_id: 'tier1', quantity: 2, status: 'paid', checkin_count: 0 } },
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (refundTicketSale as unknown as (req: Request, ctx: { routeContext: unknown; validatedBody: unknown; user: unknown }) => Promise<Response>)(
      postReq(),
      {
        routeContext: { params: { id: 'sale1' } },
        validatedBody: { reason: 'Customer cancellation' },
        user: testUser,
      }
    )
    expect(res.status).toBe(200)
    expect(state.sales.sale1.status).toBe('refunded')
    expect(state.tiers.tier1.inventory_count).toBe(4)
  })

  it('rejects refund when sale is already refunded', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 2, price: 30 } },
      sales: { sale1: { id: 'sale1', ticket_tier_id: 'tier1', quantity: 1, status: 'refunded', checkin_count: 0 } },
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (refundTicketSale as unknown as (req: Request, ctx: { routeContext: unknown; validatedBody: unknown; user: unknown }) => Promise<Response>)(
      postReq(),
      {
        routeContext: { params: { id: 'sale1' } },
        validatedBody: { reason: 'duplicate refund attempt' },
        user: testUser,
      }
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Already refunded/)
  })

  it('returns not found when refunding unknown ticket sale', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 2, price: 30 } },
      sales: {},
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const res = await (refundTicketSale as unknown as (req: Request, ctx: { routeContext: unknown; validatedBody: unknown; user: unknown }) => Promise<Response>)(
      postReq(),
      {
        routeContext: { params: { id: 'missing' } },
        validatedBody: { reason: 'missing sale' },
        user: testUser,
      }
    )
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/Ticket sale not found/)
  })

  it('blocks check-in for refunded ticket and allows valid check-in', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 0, price: 30 } },
      sales: {
        refunded: { id: 'refunded', ticket_tier_id: 'tier1', quantity: 1, status: 'refunded', checkin_count: 0 },
        valid: { id: 'valid', ticket_tier_id: 'tier1', quantity: 2, status: 'paid', checkin_count: 0 },
      },
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const blocked = await (checkinTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_sale_id: 'refunded' } }
    )
    expect(blocked.status).toBe(400)

    const allowed = await (checkinTicketSale as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      postReq(),
      { validatedBody: { ticket_sale_id: 'valid' } }
    )
    expect(allowed.status).toBe(200)
    expect(state.sales.valid.checkin_count).toBe(1)
  })
})

