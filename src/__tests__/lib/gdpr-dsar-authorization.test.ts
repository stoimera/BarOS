import type { SupabaseClient } from '@supabase/supabase-js'
import {
  assertGdprDeleteAccess,
  assertGdprExportAccess,
} from '@/lib/gdpr/dsar-authorization'

function mockSupabaseWithLinkedCustomer(customerId: string | null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: customerId ? { id: customerId } : null, error: null }),
              }
            },
          }
        },
      }
    },
  } as unknown as SupabaseClient
}

describe('assertGdprExportAccess', () => {
  it('denies customer when target customer is not their linked row', async () => {
    const supabase = mockSupabaseWithLinkedCustomer('own-id')
    const r = await assertGdprExportAccess({
      supabase,
      role: 'customer',
      profileId: 'p1',
      targetCustomerId: 'other-id',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(403)
  })

  it('allows customer when target matches linked customer', async () => {
    const supabase = mockSupabaseWithLinkedCustomer('same-id')
    const r = await assertGdprExportAccess({
      supabase,
      role: 'customer',
      profileId: 'p1',
      targetCustomerId: 'same-id',
    })
    expect(r).toEqual({ ok: true })
  })

  it('allows staff with compliance.read', async () => {
    const supabase = mockSupabaseWithLinkedCustomer(null)
    const r = await assertGdprExportAccess({
      supabase,
      role: 'staff',
      profileId: 'p1',
      targetCustomerId: 'any-id',
    })
    expect(r).toEqual({ ok: true })
  })

  it('denies unknown role', async () => {
    const supabase = mockSupabaseWithLinkedCustomer(null)
    const r = await assertGdprExportAccess({
      supabase,
      role: 'guest',
      profileId: 'p1',
      targetCustomerId: 'any-id',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(403)
  })
})

describe('assertGdprDeleteAccess', () => {
  it('denies customer when target is not own row', async () => {
    const supabase = mockSupabaseWithLinkedCustomer('a')
    const r = await assertGdprDeleteAccess({
      supabase,
      role: 'customer',
      profileId: 'p',
      targetCustomerId: 'b',
    })
    expect(r.ok).toBe(false)
  })

  it('allows customer for own row', async () => {
    const supabase = mockSupabaseWithLinkedCustomer('a')
    const r = await assertGdprDeleteAccess({
      supabase,
      role: 'customer',
      profileId: 'p',
      targetCustomerId: 'a',
    })
    expect(r).toEqual({ ok: true })
  })

  it('allows admin for any target', async () => {
    const supabase = mockSupabaseWithLinkedCustomer(null)
    const r = await assertGdprDeleteAccess({
      supabase,
      role: 'admin',
      profileId: 'p',
      targetCustomerId: 'x',
    })
    expect(r).toEqual({ ok: true })
  })
})
