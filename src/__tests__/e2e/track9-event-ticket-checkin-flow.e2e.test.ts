/**
 * @jest-environment node
 *
 * Track 9.8 — purchase then check-in (minimal mock; keep aligned with event-commerce sale flow).
 */
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
  generateCheckinTokenPlaintext: () => 'plain-token-test-track9',
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
import { POST as createTicketSale } from '@/app/api/operations/event-commerce/ticket-sales/route'
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
  promos: Record<string, never>
}

function makeSupabaseMock(state: DbState) {
  return {
    from: (table: string) => {
      const ctx: Record<string, unknown> = { table, eq: {} as Record<string, unknown>, updatePatch: null as Record<string, unknown> | null, insertRows: null as Record<string, unknown>[] | null }
      return {
        select: () => ({
          eq: (col: string, val: unknown) => {
            ;(ctx.eq as Record<string, unknown>)[col] = val
            return {
              eq: (col2: string, val2: unknown) => {
                ;(ctx.eq as Record<string, unknown>)[col2] = val2
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

async function resolveUpdateSingle(
  state: DbState,
  table: string,
  patch: Record<string, unknown>,
  eq: Record<string, unknown>
) {
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
  return { data: null, error: { message: 'unsupported update' } }
}

function postReq() {
  return {
    headers: {
      get: (_name: string) => null,
    },
  } as unknown as import('next/server').NextRequest
}

const LOC = '66666666-6666-6666-6666-666666666666'

describe('Track 9.8 ticket purchase then check-in', () => {
  it('creates a paid sale then increments check-in', async () => {
    const state: DbState = {
      tiers: { tier1: { id: 'tier1', inventory_count: 5, price: 30 } },
      sales: {},
      promos: {},
    }
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabaseMock(state))

    const saleRes = await (
      createTicketSale as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown; scopedLocationId?: string }
      ) => Promise<Response>
    )(postReq(), {
      validatedBody: { ticket_tier_id: 'tier1', quantity: 1, purchase_source: 'inventory' },
      scopedLocationId: LOC,
    })
    expect(saleRes.status).toBe(200)
    const saleJson = await saleRes.json()
    const saleId = (saleJson.data as { id: string }).id
    expect(state.tiers.tier1.inventory_count).toBe(4)

    const checkinRes = await (
      checkinTicketSale as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown; scopedLocationId?: string }
      ) => Promise<Response>
    )(postReq(), {
      validatedBody: { ticket_sale_id: saleId },
      scopedLocationId: LOC,
    })
    expect(checkinRes.status).toBe(200)
    expect(state.sales[saleId].checkin_count).toBe(1)
  })
})
