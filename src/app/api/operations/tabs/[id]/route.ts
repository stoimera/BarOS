import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { transitionTabStatus } from '@/lib/operations/tabs'

const patchTabStatusSchema = z.object({
  from_status: z.enum(['open', 'active', 'closed', 'voided']),
  to_status: z.enum(['open', 'active', 'closed', 'voided']),
  reason: z.string().min(3),
})

const patchTabPreauthSchema = z.object({
  preauth_hold_cents: z.number().int().min(0),
  preauth_status: z.enum(['none', 'pending', 'captured', 'released', 'failed']),
})

const patchTabSchema = z.union([patchTabStatusSchema, patchTabPreauthSchema])

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody, user, scopedLocationId }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof patchTabSchema>
    const supabase = await createClient()

    const { data: tabRow, error: tabReadErr } = await supabase
      .from('tabs')
      .select('order_id')
      .eq('id', params.id)
      .single()
    if (tabReadErr) return NextResponse.json({ error: tabReadErr.message }, { status: 500 })
    const tabOrderId = tabRow?.order_id as string | null | undefined

    if (scopedLocationId) {
      if (!tabOrderId) {
        return NextResponse.json(
          { error: 'Tab must be linked to an order for location-scoped staff changes' },
          { status: 403 }
        )
      }
      const { data: ord, error: oErr } = await supabase.from('orders').select('location_id').eq('id', tabOrderId).single()
      if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })
      const ol = ord?.location_id as string | null | undefined
      if (ol && ol !== scopedLocationId) {
        return NextResponse.json({ error: 'Tab order is outside your location scope' }, { status: 403 })
      }
    }

    if ('preauth_hold_cents' in body) {
      const { data, error } = await supabase
        .from('tabs')
        .update({
          preauth_hold_cents: body.preauth_hold_cents,
          preauth_status: body.preauth_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data, kind: 'preauth' })
    }

    const st = body as z.infer<typeof patchTabStatusSchema>
    try {
      const data = await transitionTabStatus({
        tabId: params.id,
        from: st.from_status,
        to: st.to_status,
        reason: st.reason,
        actorProfileId: user.profileId,
      })
      return NextResponse.json({ data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Tab transition failed' },
        { status: 400 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: patchTabSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)
