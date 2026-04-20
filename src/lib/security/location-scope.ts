import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const LOCATION_HEADER = 'x-location-id'

function jsonErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Optional explicit location scope from client (admins may narrow lists).
 */
export function getRequestedLocationIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get(LOCATION_HEADER)?.trim()
  if (header && /^[0-9a-f-]{36}$/i.test(header)) return header
  const q = req.nextUrl.searchParams.get('location_id')?.trim()
  if (q && /^[0-9a-f-]{36}$/i.test(q)) return q
  return null
}

export async function fetchStaffPrimaryLocationId(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('location_id')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error) throw error
  const id = data?.location_id
  return typeof id === 'string' ? id : null
}

export async function locationExists(supabase: SupabaseClient, locationId: string): Promise<boolean> {
  const { data, error } = await supabase.from('locations').select('id').eq('id', locationId).maybeSingle()
  if (error) throw error
  return Boolean(data?.id)
}

export type LocationScopeResolution =
  | { ok: true; scopedLocationId: string | undefined }
  | { ok: false; status: number; message: string }

/**
 * Staff are always constrained to their `staff.location_id` (header cannot escape to another location).
 * Admins may send an optional location id to narrow list queries; omit to see all rows.
 */
export async function resolveOperationsLocationScope(params: {
  supabase: SupabaseClient
  role: string
  profileId: string
  requestedFromClient: string | null
}): Promise<LocationScopeResolution> {
  const { supabase, role, profileId, requestedFromClient } = params

  if (role === 'admin') {
    if (!requestedFromClient) {
      return { ok: true, scopedLocationId: undefined }
    }
    const exists = await locationExists(supabase, requestedFromClient)
    if (!exists) {
      return { ok: false, status: 400, message: 'Unknown location_id' }
    }
    return { ok: true, scopedLocationId: requestedFromClient }
  }

  if (role === 'staff') {
    const assigned = await fetchStaffPrimaryLocationId(supabase, profileId)
    if (!assigned) {
      return {
        ok: false,
        status: 403,
        message: 'Staff location is not assigned; ask an admin to set staff.location_id',
      }
    }
    if (requestedFromClient && requestedFromClient !== assigned) {
      return { ok: false, status: 403, message: 'Location scope does not match your assignment' }
    }
    return { ok: true, scopedLocationId: assigned }
  }

  return { ok: false, status: 403, message: 'Location scope is only valid for staff or admin' }
}

/**
 * When the caller has a location scope, reject cross-location order access.
 * Orders with no `location_id` remain visible/mutable (legacy rows).
 */
export async function orderLocationGuardResponse(
  supabase: SupabaseClient,
  orderId: string,
  scopedLocationId?: string
): Promise<Response | null> {
  if (!scopedLocationId) return null
  const { data, error } = await supabase
    .from('orders')
    .select('location_id')
    .eq('id', orderId)
    .maybeSingle()
  if (error) return jsonErrorResponse(error.message, 500)
  if (!data) return jsonErrorResponse('Order not found', 404)
  const loc = data.location_id as string | null | undefined
  if (loc && loc !== scopedLocationId) {
    return jsonErrorResponse('Order is outside your location scope', 403)
  }
  return null
}

/** Legacy or unassigned events (no venue id) remain visible across scopes. */
export function eventLocationAllowed(
  eventLocationId: string | null | undefined,
  scopedLocationId?: string
): boolean {
  if (!scopedLocationId) return true
  if (eventLocationId == null || eventLocationId === '') return true
  return eventLocationId === scopedLocationId
}

export async function eventLocationGuardResponse(
  supabase: SupabaseClient,
  eventId: string,
  scopedLocationId?: string
): Promise<Response | null> {
  if (!scopedLocationId) return null
  const { data, error } = await supabase
    .from('events')
    .select('location_id')
    .eq('id', eventId)
    .maybeSingle()
  if (error) return jsonErrorResponse(error.message, 500)
  if (!data) return jsonErrorResponse('Event not found', 404)
  const loc = data.location_id as string | null | undefined
  if (loc && loc !== scopedLocationId) {
    return jsonErrorResponse('Event is outside your location scope', 403)
  }
  return null
}
