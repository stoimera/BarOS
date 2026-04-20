import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { eventLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'

const refundTicketSchema = z.object({
  reason: z.string().min(3),
})

export const PATCH = withSecurity(
  async (req: NextRequest, { routeContext, validatedBody, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const { reason } = validatedBody as z.infer<typeof refundTicketSchema>
    const supabase = await createClient()

    const { data: sale, error: saleError } = await supabase
      .from('event_ticket_sales')
      .select('*, event_ticket_tiers(event_id)')
      .eq('id', params.id)
      .single()
    if (saleError || !sale)
      return NextResponse.json({ error: 'Ticket sale not found' }, { status: 404 })
    const tierRow = sale.event_ticket_tiers as { event_id?: string } | null | undefined
    const eventId = tierRow?.event_id
    if (eventId) {
      const evGuard = await eventLocationGuardResponse(supabase, eventId, scopedLocationId)
      if (evGuard) return evGuard
    }
    if (sale.status === 'refunded')
      return NextResponse.json({ error: 'Already refunded' }, { status: 400 })

    const { data, error } = await supabase
      .from('event_ticket_sales')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const source = (sale as { purchase_source?: string }).purchase_source ?? 'inventory'
    const { data: tier } = await supabase
      .from('event_ticket_tiers')
      .select('inventory_count, reserved_count')
      .eq('id', sale.ticket_tier_id)
      .single()

    if (tier) {
      if (source === 'reserved') {
        const rc = Number((tier as { reserved_count?: number }).reserved_count ?? 0)
        await supabase
          .from('event_ticket_tiers')
          .update({ reserved_count: rc + Number(sale.quantity) })
          .eq('id', sale.ticket_tier_id)
          .select()
          .single()
      } else {
        await supabase
          .from('event_ticket_tiers')
          .update({ inventory_count: Number(tier.inventory_count) + Number(sale.quantity) })
          .eq('id', sale.ticket_tier_id)
          .select()
          .single()
      }
    }

    return NextResponse.json({ data, reason })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: refundTicketSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)
