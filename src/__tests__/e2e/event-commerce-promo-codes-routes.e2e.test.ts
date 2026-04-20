jest.mock('@/lib/security/api-middleware', () => ({
  withSecurity: (handler: unknown) => handler,
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
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
import { GET as getPromoCodes, POST as createPromoCode } from '@/app/api/operations/event-commerce/promo-codes/route'

type Promo = {
  id: string
  code: string
  max_redemptions: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
}

function makeSupabaseMock(initialPromos: Promo[] = [], failInsert = false) {
  const state = {
    promos: [...initialPromos],
  }

  return {
    state,
    client: {
      from: (table: string) => ({
        select: () => ({
          order: async () => ({ data: table === 'promo_codes' ? state.promos : [], error: null }),
          single: async () => ({ data: null, error: { message: 'unsupported single' } }),
        }),
        insert: (rows: Record<string, unknown>[]) => ({
          select: () => ({
            single: async () => {
              if (failInsert) return { data: null, error: { message: 'insert failed' } }
              const row = rows[0]
              const created: Promo = {
                id: `promo-${state.promos.length + 1}`,
                code: String(row.code),
                max_redemptions: Number(row.max_redemptions),
                discount_type: row.discount_type as Promo['discount_type'],
                discount_value: Number(row.discount_value),
              }
              state.promos.unshift(created)
              return { data: created, error: null }
            },
          }),
        }),
      }),
    },
  }
}

describe('event commerce promo-codes route-level verification', () => {
  it('lists promo codes ordered by latest first', async () => {
    const mock = makeSupabaseMock([
      { id: 'p2', code: 'VIP20', max_redemptions: 10, discount_type: 'percentage', discount_value: 20 },
      { id: 'p1', code: 'WELCOME5', max_redemptions: 50, discount_type: 'fixed', discount_value: 5 },
    ])
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    const res = await (getPromoCodes as unknown as () => Promise<Response>)()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].code).toBe('VIP20')
  })

  it('creates a promo code and defaults max_redemptions to 1', async () => {
    const mock = makeSupabaseMock()
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    const res = await (createPromoCode as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      {} as Request,
      {
        validatedBody: {
          code: 'FLASH10',
          discount_type: 'percentage',
          discount_value: 10,
        },
      }
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.code).toBe('FLASH10')
    expect(json.data.max_redemptions).toBe(1)
  })

  it('returns 500 when promo code insertion fails', async () => {
    const mock = makeSupabaseMock([], true)
    ;(createClient as jest.Mock).mockResolvedValue(mock.client)

    const res = await (createPromoCode as unknown as (req: Request, ctx: { validatedBody: unknown }) => Promise<Response>)(
      {} as Request,
      {
        validatedBody: {
          code: 'BROKEN',
          discount_type: 'fixed',
          discount_value: 5,
          max_redemptions: 2,
        },
      }
    )

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('insert failed')
  })
})
