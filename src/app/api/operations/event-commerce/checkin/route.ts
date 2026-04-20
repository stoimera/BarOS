import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { eventLocationGuardResponse } from '@/lib/security/location-scope'
import { createClient } from '@/utils/supabase/server'
import { getOrExecuteIdempotent } from '@/lib/operations/idempotency'
import { hashCheckinToken } from '@/lib/operations/checkin-token'

const checkinSchema = z
  .object({
    ticket_sale_id: z.string().uuid().optional(),
    checkin_token: z.string().min(16).optional(),
  })
  .superRefine((v, ctx) => {
    const hasId = Boolean(v.ticket_sale_id)
    const hasTok = Boolean(v.checkin_token)
    if (hasId === hasTok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of ticket_sale_id or checkin_token',
      })
    }
  })

export const POST = withSecurity(
  async (req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof checkinSchema>
    const idem = req.headers.get('idempotency-key') ?? req.headers.get('x-idempotency-key')

    const result = await getOrExecuteIdempotent('event-commerce:checkin', idem, async () => {
      const supabase = await createClient()

      let sale: Record<string, unknown> | null = null
      let loadError: { message: string } | null = null

      if (body.checkin_token) {
        const digest = hashCheckinToken(body.checkin_token)
        const { data, error } = await supabase
          .from('event_ticket_sales')
          .select('*, event_ticket_tiers(event_id)')
          .eq('checkin_token_hash', digest)
          .maybeSingle()
        sale = data as Record<string, unknown> | null
        loadError = error
      } else {
        const { data, error } = await supabase
          .from('event_ticket_sales')
          .select('*, event_ticket_tiers(event_id)')
          .eq('id', body.ticket_sale_id as string)
          .single()
        sale = data as Record<string, unknown> | null
        loadError = error
      }

      if (loadError || !sale) {
        return { status: 404, body: { error: 'Ticket not found' } }
      }

      const tierRow = sale.event_ticket_tiers as { event_id?: string } | null | undefined
      const eventId = tierRow?.event_id
      if (eventId) {
        const evGuard = await eventLocationGuardResponse(supabase, eventId, scopedLocationId)
        if (evGuard) {
          const errBody = (await evGuard.json()) as { error?: string }
          return { status: evGuard.status, body: { error: errBody.error ?? 'Forbidden' } }
        }
      }

      if (sale.status === 'refunded' || sale.status === 'cancelled') {
        return { status: 400, body: { error: 'Ticket is not valid for check-in' } }
      }
      if (Number(sale.checkin_count) >= Number(sale.quantity)) {
        return { status: 400, body: { error: 'Already fully checked in' } }
      }
      if (sale.fraud_flag) {
        return { status: 403, body: { error: 'Ticket is flagged for fraud review' } }
      }

      const saleId = String(sale.id)
      const nextCount = Number(sale.checkin_count) + 1
      const { data: updated, error: updateError } = await supabase
        .from('event_ticket_sales')
        .update({
          checkin_count: nextCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saleId)
        .select()
        .single()
      if (updateError) {
        return { status: 500, body: { error: updateError.message } }
      }

      return { status: 200, body: { data: stripSaleForClient(updated as Record<string, unknown>) } }
    })

    return NextResponse.json(result.body, { status: result.status })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'event_commerce.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: checkinSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)

function stripSaleForClient(row: Record<string, unknown>) {
  const { checkin_token_hash: _h, ...rest } = row
  return rest
}
