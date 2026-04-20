/**
 * @jest-environment node
 */
jest.mock('@/lib/security/api-middleware', () => ({
  withSecurity: (handler: unknown) => handler,
}))

jest.mock('@/lib/security/audit', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/operations/stocktakes', () => ({
  commitStocktake: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      headers: new Headers(),
      json: async () => body,
    }),
  },
}))

import { createClient } from '@/utils/supabase/server'
import { commitStocktake } from '@/lib/operations/stocktakes'
import { PATCH as receivePo } from '@/app/api/operations/purchase-orders/[id]/receive/route'
import { POST as createStocktake } from '@/app/api/operations/stocktakes/route'
import { POST as commitStocktakeRoute } from '@/app/api/operations/stocktakes/[id]/commit/route'

const LOC = '22222222-2222-2222-2222-222222222222'
const PO_ID = '33333333-3333-3333-3333-333333333333'
const ST_ID = '44444444-4444-4444-4444-444444444444'
const INV_ID = '55555555-5555-5555-5555-555555555555'

function jsonReq(url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return {
    url,
    headers: new Headers({ 'content-type': 'application/json' }),
    method,
    json: async () => body,
  } as unknown as import('next/server').NextRequest
}

describe('Track 9.7 receive PO → stocktake → commit', () => {
  it('runs the three route steps with scoped inventory', async () => {
    const receiveClient = {
      from: (table: string) => {
        if (table === 'purchase_orders') {
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: { id: PO_ID, status: 'received' },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected ${table}`)
      },
    }
    ;(createClient as jest.Mock).mockResolvedValueOnce(receiveClient)

    const rec = await (
      receivePo as unknown as (
        req: import('next/server').NextRequest,
        ctx: { routeContext: unknown; validatedBody: unknown; user: unknown }
      ) => Promise<Response>
    )(jsonReq('http://x', {}, 'PATCH'), {
      routeContext: { params: { id: PO_ID } },
      validatedBody: {},
      user: { id: 'u1', role: 'staff', profileId: 'p1' },
    })
    expect(rec.status).toBe(200)

    const stockClient = {
      from: (table: string) => {
        if (table === 'inventory') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { location_id: LOC }, error: null }),
              }),
            }),
          }
        }
        if (table === 'stocktakes') {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: ST_ID,
                    inventory_id: INV_ID,
                    counted_quantity: 10,
                    expected_quantity: 8,
                    status: 'counted',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected ${table}`)
      },
    }
    ;(createClient as jest.Mock).mockResolvedValueOnce(stockClient)

    const st = await (
      createStocktake as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown; scopedLocationId?: string; user: unknown }
      ) => Promise<Response>
    )(
      jsonReq('http://x', {
        inventory_id: INV_ID,
        counted_quantity: 10,
        expected_quantity: 8,
        status: 'counted',
      }),
      {
        validatedBody: {
          inventory_id: INV_ID,
          counted_quantity: 10,
          expected_quantity: 8,
          status: 'counted',
        },
        scopedLocationId: LOC,
        user: { id: 'u1', role: 'staff', profileId: 'p1' },
      }
    )
    expect(st.status).toBe(200)

    const commitClient = {
      from: (table: string) => {
        if (table !== 'stocktakes') throw new Error(`unexpected ${table}`)
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: ST_ID, status: 'committed', inventory_id: INV_ID },
                error: null,
              }),
            }),
          }),
        }
      },
    }
    ;(createClient as jest.Mock).mockResolvedValueOnce(commitClient)

    const cm = await (
      commitStocktakeRoute as unknown as (
        req: import('next/server').NextRequest,
        ctx: { routeContext: unknown; user: unknown; validatedBody?: unknown }
      ) => Promise<Response>
    )(jsonReq('http://x', {}), {
      routeContext: { params: { id: ST_ID } },
      validatedBody: {},
      user: { id: 'u1', role: 'staff', profileId: 'p1' },
    })
    expect(cm.status).toBe(200)
    expect(commitStocktake).toHaveBeenCalled()
  })
})
