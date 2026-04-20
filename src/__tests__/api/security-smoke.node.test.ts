/**
 * Track 1 — Negative auth checks (Node environment; avoids jsdom stripping `Request`).
 * @jest-environment node
 */

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ getAll: () => [] as { name: string; value: string }[] })),
}))

jest.mock('@/utils/supabase/server-user', () => ({
  createUserSupabaseClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
    },
  })),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimit: jest.fn(async () => null),
  apiRateLimiter: {},
  authRateLimiter: {},
  strictRateLimiter: {},
  getClientIdentifier: () => 'jest-smoke',
}))

import { NextRequest } from 'next/server'
import { GET as bookingsList } from '@/app/api/bookings/route'
import { GET as suppliersList } from '@/app/api/operations/suppliers/route'
import { GET as staffList } from '@/app/api/staff/route'
import { GET as eventsList } from '@/app/api/events/route'

describe('API security smoke (unauthenticated)', () => {
  function req(url: string) {
    return new NextRequest(url)
  }

  it('bookings cluster returns 401 (1.2)', async () => {
    const res = await bookingsList(req('http://localhost/api/bookings'), {})
    expect(res.status).toBe(401)
  })

  it('operations procurement cluster returns 401 (1.7)', async () => {
    const res = await suppliersList(req('http://localhost/api/operations/suppliers'), {})
    expect(res.status).toBe(401)
  })

  it('staff cluster returns 401 (1.8)', async () => {
    const res = await staffList(req('http://localhost/api/staff'), {})
    expect(res.status).toBe(401)
  })

  it('events cluster returns 401 (1.3)', async () => {
    const res = await eventsList(req('http://localhost/api/events'), {})
    expect(res.status).toBe(401)
  })
})
