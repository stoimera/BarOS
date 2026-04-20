import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { ensureCustomerLoyaltyRow } from '@/lib/loyalty/ensure-customer-loyalty'
import { z } from 'zod'

const log = createLogger('api.customer.loyalty.punch-voucher')

const bodySchema = z.object({
  punchKind: z.enum(['coffee', 'alcohol']),
})

function generatePunchVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'UL-'
  for (let i = 0; i < 10; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export const POST = withSecurity(
  async (_req, { user, validatedBody }) => {
    try {
      if (user.role !== 'customer') {
        return NextResponse.json({ error: 'Only customers can request punch vouchers' }, { status: 403 })
      }

      const { punchKind } = validatedBody as z.infer<typeof bodySchema>
      const admin = await createServiceRoleClient()

      const { data: customer, error: customerError } = await admin
        .from('customers')
        .select('id, name')
        .eq('profile_id', user.profileId)
        .single()

      if (customerError || !customer?.id) {
        return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
      }

      const ensured = await ensureCustomerLoyaltyRow(admin, customer.id)
      if (!ensured) {
        return NextResponse.json({ error: 'Could not initialize loyalty for your account' }, { status: 500 })
      }

      const { data: loyalty, error: loyaltyError } = await admin
        .from('loyalty')
        .select(
          'id, coffee_punch_count, coffee_goal, coffee_rewarded, alcohol_punch_count, alcohol_goal, alcohol_rewarded'
        )
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (loyaltyError || !loyalty) {
        return NextResponse.json({ error: 'Loyalty record not found' }, { status: 404 })
      }

      const eligible =
        punchKind === 'coffee'
          ? loyalty.coffee_punch_count >= loyalty.coffee_goal
          : loyalty.alcohol_punch_count >= loyalty.alcohol_goal

      if (!eligible) {
        return NextResponse.json(
          { error: 'Punch card is not ready for a voucher (complete the card first).' },
          { status: 400 }
        )
      }

      const { data: existing } = await admin
        .from('enhanced_rewards')
        .select('id, redemption_code, expires_at')
        .eq('customer_id', customer.id)
        .eq('punch_kind', punchKind)
        .eq('claimed', false)
        .eq('status', 'active')
        .maybeSingle()

      if (existing?.redemption_code) {
        return NextResponse.json({
          code: existing.redemption_code,
          expires_at: existing.expires_at,
          reused: true,
          customer: { id: customer.id, name: customer.name ?? 'Customer' },
          punch_kind: punchKind,
        })
      }

      const category = punchKind === 'coffee' ? 'free_coffee' : 'free_alcoholic_drink'
      const description =
        punchKind === 'coffee'
          ? 'Punch card: free coffee — show QR at the bar for staff to scan.'
          : 'Punch card: free alcoholic drink — show QR at the bar for staff to scan.'

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const redemptionCode = generatePunchVoucherCode()

      const { data: inserted, error: insertError } = await admin
        .from('enhanced_rewards')
        .insert({
          customer_id: customer.id,
          category,
          description,
          value: 0,
          requires_age_verification: punchKind === 'alcohol',
          min_age: punchKind === 'alcohol' ? 21 : 0,
          redemption_code: redemptionCode,
          status: 'active',
          claimed: false,
          punch_kind: punchKind,
          expires_at: expiresAt,
        })
        .select('redemption_code, expires_at')
        .single()

      if (insertError) {
        log.error('punch_voucher_insert_failed', { message: insertError.message })
        if (insertError.code === '23505') {
          const { data: again } = await admin
            .from('enhanced_rewards')
            .select('redemption_code, expires_at')
            .eq('customer_id', customer.id)
            .eq('punch_kind', punchKind)
            .eq('claimed', false)
            .eq('status', 'active')
            .maybeSingle()
          if (again?.redemption_code) {
            return NextResponse.json({
              code: again.redemption_code,
              expires_at: again.expires_at,
              reused: true,
              customer: { id: customer.id, name: customer.name ?? 'Customer' },
              punch_kind: punchKind,
            })
          }
        }
        return NextResponse.json({ error: 'Could not create voucher' }, { status: 500 })
      }

      return NextResponse.json({
        code: inserted.redemption_code,
        expires_at: inserted.expires_at,
        reused: false,
        customer: { id: customer.id, name: customer.name ?? 'Customer' },
        punch_kind: punchKind,
      })
    } catch (e) {
      log.error('punch_voucher_error', { error: e instanceof Error ? e.message : String(e) })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    validateBody: bodySchema,
    rateLimitType: 'auth',
    auditAction: 'create',
    auditResourceType: 'reward',
  }
)
