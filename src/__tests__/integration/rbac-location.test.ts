/**
 * @jest-environment node
 */
import {
  eventLocationAllowed,
  eventLocationGuardResponse,
  orderLocationGuardResponse,
  resolveOperationsLocationScope,
} from '@/lib/security/location-scope'
import { listPermissionsForRole, OPERATIONS_PERMISSION_MATRIX } from '@/lib/security/permissions'

describe('Track 5 RBAC + location scope', () => {
  it('exposes a stable permission matrix (5.1)', () => {
    expect(OPERATIONS_PERMISSION_MATRIX.length).toBeGreaterThan(5)
    const keys = new Set(OPERATIONS_PERMISSION_MATRIX.map((r) => r.permission))
    expect(keys.has('orders.read')).toBe(true)
  })

  it('lists permissions per role (5.1)', () => {
    expect(listPermissionsForRole('admin').includes('locations.write')).toBe(true)
    expect(listPermissionsForRole('staff').includes('locations.write')).toBe(false)
    expect(listPermissionsForRole('customer')).toEqual([])
  })

  it('allows admin without header to mean “all locations” (5.5)', async () => {
    const supabase = {
      from: () => {
        throw new Error('should not query when no location filter')
      },
    } as never
    const r = await resolveOperationsLocationScope({
      supabase,
      role: 'admin',
      profileId: 'p1',
      requestedFromClient: null,
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.scopedLocationId).toBeUndefined()
  })

  it('rejects staff when header location disagrees with assignment (5.7)', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'staff') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { location_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected ${table}`)
      },
    } as never
    const r = await resolveOperationsLocationScope({
      supabase,
      role: 'staff',
      profileId: 'p1',
      requestedFromClient: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(403)
  })

  it('scopes staff to assigned location when header omitted (5.5)', async () => {
    const loc = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    const supabase = {
      from: (table: string) => {
        if (table === 'staff') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { location_id: loc }, error: null }),
              }),
            }),
          }
        }
        throw new Error(`unexpected ${table}`)
      },
    } as never
    const r = await resolveOperationsLocationScope({
      supabase,
      role: 'staff',
      profileId: 'p1',
      requestedFromClient: null,
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.scopedLocationId).toBe(loc)
  })

  it('eventLocationAllowed treats null venue as cross-scope visible (5.5)', () => {
    expect(eventLocationAllowed(null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(true)
    expect(eventLocationAllowed('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(
      true
    )
    expect(eventLocationAllowed('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(
      false
    )
  })

  it('orderLocationGuardResponse returns 403 on location mismatch (5.7)', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { location_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
              error: null,
            }),
          }),
        }),
      }),
    } as never
    const res = await orderLocationGuardResponse(
      supabase,
      'order-1',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    )
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })

  it('eventLocationGuardResponse returns 404 when event is missing (5.7)', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never
    const res = await eventLocationGuardResponse(supabase, 'missing-event', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(res).not.toBeNull()
    expect(res!.status).toBe(404)
  })
})
