import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { eventLocationAllowed, eventLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

const tierPostSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reserve'),
    ticket_tier_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('release'),
    ticket_tier_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
])

export const GET = withSecurity(
  async (_req, { scopedLocationId }: { scopedLocationId?: string } = {}) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('event_ticket_tiers')
      .select('*, events(id, title, event_date, location_id)')
      .order('tier_name', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rows = data || []
    const filtered = scopedLocationId
      ? rows.filter((row) => {
          const loc = (row as { events?: { location_id?: string | null } | null }).events?.location_id
          return eventLocationAllowed(loc, scopedLocationId)
        })
      : rows
    return NextResponse.json({ data: filtered })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'event',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof tierPostSchema>
    const supabase = await createClient()

    const { data: tier, error: tierError } = await supabase
      .from('event_ticket_tiers')
      .select('*')
      .eq('id', body.ticket_tier_id)
      .single()
    if (tierError || !tier) return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 })

    const eventId = tier.event_id as string | undefined
    if (eventId) {
      const g = await eventLocationGuardResponse(supabase, eventId, scopedLocationId)
      if (g) return g
    }

    const reservedCount = Number((tier as { reserved_count?: number }).reserved_count ?? 0)
    const inventoryCount = Number(tier.inventory_count)

    if (body.action === 'reserve') {
      if (inventoryCount < body.quantity) {
        return NextResponse.json({ error: 'Insufficient inventory to reserve' }, { status: 400 })
      }
      const { data: updated, error: upErr } = await supabase
        .from('event_ticket_tiers')
        .update({
          inventory_count: inventoryCount - body.quantity,
          reserved_count: reservedCount + body.quantity,
        })
        .eq('id', body.ticket_tier_id)
        .eq('inventory_count', inventoryCount)
        .select()
        .single()
      if (upErr || !updated) {
        return NextResponse.json({ error: 'Reservation conflict; retry' }, { status: 409 })
      }
      return NextResponse.json({ data: updated })
    }

    if (reservedCount < body.quantity) {
      return NextResponse.json({ error: 'Cannot release more than reserved pool' }, { status: 400 })
    }
    const { data: updated, error: upErr } = await supabase
      .from('event_ticket_tiers')
      .update({
        inventory_count: inventoryCount + body.quantity,
        reserved_count: reservedCount - body.quantity,
      })
      .eq('id', body.ticket_tier_id)
      .eq('reserved_count', reservedCount)
      .select()
      .single()
    if (upErr || !updated) {
      return NextResponse.json({ error: 'Release conflict; retry' }, { status: 409 })
    }
    return NextResponse.json({ data: updated })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: tierPostSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)
