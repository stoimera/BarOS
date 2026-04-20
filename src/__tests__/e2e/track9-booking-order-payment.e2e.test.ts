/**
 * @jest-environment node
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

jest.mock('@/lib/security/audit', () => ({
  auditLog: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
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
import { POST as createBooking } from '@/app/api/bookings/route'
import { POST as createOrder } from '@/app/api/operations/orders/route'
import { POST as createPayment } from '@/app/api/operations/payments/route'

const LOC = '11111111-1111-1111-1111-111111111111'

function postReq(url: string, body: unknown, headers?: Record<string, string>) {
  const h = new Headers({ 'content-type': 'application/json', ...headers })
  return { url, headers: h, method: 'POST', json: async () => body } as unknown as import('next/server').NextRequest
}

function makeSupabase() {
  return {
    from: (table: string) => {
      if (table === 'customers') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'cust-1' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'bookings') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'bk-1',
                  customer_id: 'cust-1',
                  booking_date: '2026-06-01',
                  start_time: '19:00',
                  party_size: 2,
                  notes: null,
                  status: 'confirmed',
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  customers: { id: 'cust-1', name: 'Pat', email: 'pat@example.com', phone: null },
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'orders') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: 'ord-1', customer_id: 'cust-1', location_id: LOC, status: 'open' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'payment_transactions') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'pay-1',
                  order_id: 'ord-1',
                  amount: 42,
                  payment_method: 'card',
                  status: 'pending',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  }
}

describe('Track 9.6 booking → order → payment flow', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  })

  it('chains staff booking, open order, and payment', async () => {
    ;(createClient as jest.Mock).mockResolvedValue(makeSupabase())

    const bookingRes = await (
      createBooking as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown }
      ) => Promise<Response>
    )(postReq('http://localhost/api/bookings', {
      customer_name: 'Pat',
      customer_email: 'pat@example.com',
      date: '2026-06-01',
      time: '19:00',
      party_size: 2,
    }), {
      validatedBody: {
        customer_name: 'Pat',
        customer_email: 'pat@example.com',
        date: '2026-06-01',
        time: '19:00',
        party_size: 2,
      },
    })

    expect(bookingRes.status).toBe(200)
    const bookingJson = await bookingRes.json()
    expect(bookingJson.id).toBe('bk-1')

    const orderRes = await (
      createOrder as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown; scopedLocationId?: string; user: unknown }
      ) => Promise<Response>
    )(
      postReq('http://localhost/api/operations/orders', {
        customer_id: 'cust-1',
        table_id: null,
        location_id: LOC,
      }),
      {
        validatedBody: {
          customer_id: 'cust-1',
          table_id: null,
          location_id: LOC,
        },
        scopedLocationId: LOC,
        user: { id: 'u1', role: 'staff', profileId: 'prof-1' },
      }
    )
    expect(orderRes.status).toBe(200)
    const orderJson = await orderRes.json()
    expect(orderJson.data.id).toBe('ord-1')

    const paySupabase = {
      from: (table: string) => {
        if (table === 'orders') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { location_id: LOC }, error: null }),
              }),
            }),
          }
        }
        if (table === 'payment_transactions') {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: 'pay-1', order_id: 'ord-1', amount: 42, payment_method: 'card', status: 'pending' },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    }
    ;(createClient as jest.Mock).mockResolvedValue(paySupabase)

    const payRes = await (
      createPayment as unknown as (
        req: import('next/server').NextRequest,
        ctx: { validatedBody: unknown; scopedLocationId?: string; user: unknown }
      ) => Promise<Response>
    )(
      postReq('http://localhost/api/operations/payments', {
        order_id: 'ord-1',
        amount: 42,
        payment_method: 'card',
      }),
      {
        validatedBody: { order_id: 'ord-1', amount: 42, payment_method: 'card' },
        scopedLocationId: LOC,
        user: { id: 'u1', role: 'staff', profileId: 'prof-1' },
      }
    )
    expect(payRes.status).toBe(200)
    const payJson = await payRes.json()
    expect(payJson.data.id).toBe('pay-1')
  })
})
