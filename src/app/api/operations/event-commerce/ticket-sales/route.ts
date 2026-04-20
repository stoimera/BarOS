import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import {
  eventLocationAllowed,
  eventLocationGuardResponse,
} from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getOrExecuteIdempotent } from '@/lib/operations/idempotency'
import { generateCheckinTokenPlaintext, hashCheckinToken } from '@/lib/operations/checkin-token'
import { promoActiveAt } from '@/lib/operations/promo-eligibility'

const createTicketSaleSchema = z.object({
  ticket_tier_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  promo_code: z.string().optional(),
  purchase_source: z.enum(['inventory', 'reserved']).optional().default('inventory'),
})

function stripSaleForClient(row: Record<string, unknown>) {
  const { checkin_token_hash: _h, ...rest } = row
  return rest
}

async function revertPromoRedemption(supabase: SupabaseClient, promoId: string) {
  const { data: p } = await supabase.from('promo_codes').select('redeemed_count').eq('id', promoId).single()
  if (p && typeof p.redeemed_count === 'number') {
    await supabase
      .from('promo_codes')
      .update({ redeemed_count: Math.max(0, p.redeemed_count - 1) })
      .eq('id', promoId)
      .select()
      .single()
  }
}

export const GET = withSecurity(
  async (_req, { scopedLocationId }: { scopedLocationId?: string } = {}) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('event_ticket_sales')
      .select('*, event_ticket_tiers(id, tier_name, event_id, events(location_id))')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rows = (data || []).map((row) => stripSaleForClient(row as Record<string, unknown>))
    const filtered = scopedLocationId
      ? rows.filter((row) => {
          const loc = (
            row as {
              event_ticket_tiers?: { events?: { location_id?: string | null } | null } | null
            }
          ).event_ticket_tiers?.events?.location_id
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
  async (req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createTicketSaleSchema>
    const idem = req.headers.get('idempotency-key') ?? req.headers.get('x-idempotency-key')

    const result = await getOrExecuteIdempotent('event-commerce:ticket-sale:create', idem, async () => {
      const supabase = await createClient()
      const purchaseSource = body.purchase_source ?? 'inventory'

      const { data: tier, error: tierError } = await supabase
        .from('event_ticket_tiers')
        .select('*')
        .eq('id', body.ticket_tier_id)
        .single()
      if (tierError || !tier) {
        return { status: 404, body: { error: 'Ticket tier not found' } }
      }
      const eventId = tier.event_id as string | undefined
      if (eventId) {
        const evGuard = await eventLocationGuardResponse(supabase, eventId, scopedLocationId)
        if (evGuard) {
          const errBody = (await evGuard.json()) as { error?: string }
          return { status: evGuard.status, body: { error: errBody.error ?? 'Location guard failed' } }
        }
      }

      const reservedCount = Number((tier as { reserved_count?: number }).reserved_count ?? 0)
      const inventoryCount = Number(tier.inventory_count)

      if (purchaseSource === 'reserved') {
        if (reservedCount < body.quantity) {
          return { status: 400, body: { error: 'Insufficient reserved inventory' } }
        }
      } else if (inventoryCount < body.quantity) {
        return { status: 400, body: { error: 'Insufficient ticket inventory' } }
      }

      let discountAmount = 0
      let promoCodeId: string | null = null

      if (body.promo_code) {
        const { data: promo, error: promoErr } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', body.promo_code)
          .eq('is_active', true)
          .single()

        if (promoErr || !promo) {
          return { status: 400, body: { error: 'Invalid or inactive promo code' } }
        }
        if (!promoActiveAt(promo)) {
          return { status: 400, body: { error: 'Promo code is not active for the current time window' } }
        }
        if (promo.redeemed_count < promo.max_redemptions) {
          const maxPer = promo.max_uses_per_customer as number | null | undefined
          if (maxPer != null && body.customer_id) {
            const { count, error: cErr } = await supabase
              .from('event_ticket_sales')
              .select('*', { count: 'exact', head: true })
              .eq('promo_code_id', promo.id)
              .eq('customer_id', body.customer_id)
            if (cErr) return { status: 500, body: { error: cErr.message } }
            if ((count ?? 0) >= maxPer) {
              return { status: 400, body: { error: 'Promo customer usage limit reached' } }
            }
          }

          const promoEventId = promo.event_id as string | null | undefined
          if (promoEventId) {
            const pGuard = await eventLocationGuardResponse(supabase, promoEventId, scopedLocationId)
            if (pGuard) {
              const errBody = (await pGuard.json()) as { error?: string }
              return { status: pGuard.status, body: { error: errBody.error ?? 'Location guard failed' } }
            }
            if (promoEventId !== eventId) {
              return { status: 400, body: { error: 'Promo code is not valid for this event' } }
            }
          }
          promoCodeId = promo.id
          discountAmount =
            promo.discount_type === 'percentage'
              ? (Number(tier.price) * body.quantity * Number(promo.discount_value)) / 100
              : Number(promo.discount_value)
          await supabase
            .from('promo_codes')
            .update({ redeemed_count: promo.redeemed_count + 1 })
            .eq('id', promo.id)
            .select()
            .single()
        }
      }

      const gross = Number(tier.price) * body.quantity
      const totalAmount = Math.max(0, Number((gross - discountAmount).toFixed(2)))

      if (purchaseSource === 'reserved') {
        const { data: tierLocked, error: lockErr } = await supabase
          .from('event_ticket_tiers')
          .update({ reserved_count: reservedCount - body.quantity })
          .eq('id', body.ticket_tier_id)
          .eq('reserved_count', reservedCount)
          .select()
          .single()
        if (lockErr || !tierLocked) {
          if (promoCodeId) await revertPromoRedemption(supabase, promoCodeId)
          return { status: 409, body: { error: 'Reserved inventory changed; retry' } }
        }
      }

      const { data: sale, error: saleErr } = await supabase
        .from('event_ticket_sales')
        .insert([
          {
            ticket_tier_id: body.ticket_tier_id,
            customer_id: body.customer_id || null,
            promo_code_id: promoCodeId,
            quantity: body.quantity,
            unit_price: Number(tier.price),
            discount_amount: Number(discountAmount.toFixed(2)),
            total_amount: totalAmount,
            status: 'paid',
            purchase_source: purchaseSource,
          },
        ])
        .select()
        .single()

      if (saleErr || !sale) {
        if (promoCodeId) await revertPromoRedemption(supabase, promoCodeId)
        if (purchaseSource === 'reserved') {
          await supabase
            .from('event_ticket_tiers')
            .update({ reserved_count: reservedCount })
            .eq('id', body.ticket_tier_id)
            .select()
            .single()
        }
        return { status: 500, body: { error: saleErr?.message ?? 'Insert failed' } }
      }

      if (purchaseSource === 'inventory') {
        const { data: invTier, error: invErr } = await supabase
          .from('event_ticket_tiers')
          .update({ inventory_count: inventoryCount - body.quantity })
          .eq('id', body.ticket_tier_id)
          .eq('inventory_count', inventoryCount)
          .select()
          .single()
        if (invErr || !invTier) {
          await supabase.from('event_ticket_sales').delete().eq('id', (sale as { id: string }).id)
          if (promoCodeId) await revertPromoRedemption(supabase, promoCodeId)
          return { status: 409, body: { error: 'Inventory changed during purchase; retry' } }
        }
      }

      const plainToken = generateCheckinTokenPlaintext()
      const digest = hashCheckinToken(plainToken)
      await supabase
        .from('event_ticket_sales')
        .update({ checkin_token_hash: digest })
        .eq('id', (sale as { id: string }).id)
        .select()
        .single()

      return {
        status: 200,
        body: {
          data: {
            ...(stripSaleForClient(sale as Record<string, unknown>) as object),
            checkin_token: plainToken,
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createTicketSaleSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)
