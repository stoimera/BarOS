import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'
import { normalizeVoucherCode } from '@/lib/loyalty/voucher-code'
import { resolveRedeemingStaffId } from '@/lib/loyalty/resolve-redeem-staff'

const log = createLogger('api.rewards.redeem')

const redeemVoucherSchema = z.object({
  voucherCode: z.string().min(1),
  /** Required for admins not linked to a staff row; ignored when caller has their own staff row */
  staffId: z.string().uuid().optional(),
})

type CustomerBrief = { id: string; name: string; email: string | null }

type RewardRow = {
  id: string
  customer_id: string
  punch_kind: string | null
  category: string
  description: string
  value: number | null
  expires_at: string
  claimed: boolean
  status: string
  customer?: CustomerBrief | CustomerBrief[] | null
}

function singleJoinedCustomer(
  rel: CustomerBrief | CustomerBrief[] | null | undefined
): CustomerBrief | null {
  if (rel == null) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export const POST = withSecurity(
  async (_req, { user, validatedBody }) => {
    try {
      const raw = (validatedBody as z.infer<typeof redeemVoucherSchema>).voucherCode
      const voucherCode = normalizeVoucherCode(raw)
      if (!voucherCode) {
        return NextResponse.json({ error: 'Invalid voucher code' }, { status: 400 })
      }

      const { staffId: requestedStaffId } = validatedBody as z.infer<typeof redeemVoucherSchema>
      const supabase = await createClient()
      const staffResolution = await resolveRedeemingStaffId({
        supabase,
        user,
        requestedStaffId: requestedStaffId ?? null,
      })
      if (staffResolution instanceof NextResponse) {
        return staffResolution
      }
      const staffId = staffResolution.staffId

      const sr = await createServiceRoleClient()

      const { data: reward, error: rewardError } = await sr
        .from('enhanced_rewards')
        .select(
          `
        id,
        customer_id,
        punch_kind,
        category,
        description,
        value,
        expires_at,
        claimed,
        status,
        customer:customers(id, name, email)
      `
        )
        .eq('redemption_code', voucherCode)
        .maybeSingle()

      if (rewardError || !reward) {
        return NextResponse.json({ error: 'Invalid or expired voucher code' }, { status: 404 })
      }

      const r = reward as unknown as RewardRow

      if (r.claimed || r.status !== 'active') {
        return NextResponse.json({ error: 'This voucher has already been used' }, { status: 409 })
      }

      if (new Date(r.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 })
      }

      const now = new Date().toISOString()
      const { data: claimedRow, error: claimErr } = await sr
        .from('enhanced_rewards')
        .update({
          claimed: true,
          claimed_at: now,
          claimed_by_staff_id: staffId,
          status: 'claimed',
        })
        .eq('id', r.id)
        .eq('claimed', false)
        .select('id')
        .maybeSingle()

      if (claimErr || !claimedRow?.id) {
        log.error('redeem_claim_failed', { voucherCode, claimErr })
        return NextResponse.json({ error: 'Could not complete redemption (try again)' }, { status: 409 })
      }

      const punchKind = r.punch_kind

      if (punchKind === 'coffee' || punchKind === 'alcohol') {
        const patch =
          punchKind === 'coffee'
            ? { coffee_punch_count: 0, coffee_rewarded: false }
            : { alcohol_punch_count: 0, alcohol_rewarded: false }

        const { data: loyaltyRow, error: loyaltyErr } = await sr
          .from('loyalty')
          .update(patch)
          .eq('customer_id', r.customer_id)
          .select('id')
          .maybeSingle()

        if (loyaltyErr || !loyaltyRow?.id) {
          log.error('loyalty_reset_failed', {
            customerId: r.customer_id,
            punchKind,
            loyaltyErr,
          })
          const { error: rollbackErr } = await sr
            .from('enhanced_rewards')
            .update({
              claimed: false,
              claimed_at: null,
              claimed_by_staff_id: null,
              status: 'active',
            })
            .eq('id', r.id)
          if (rollbackErr) {
            log.error('redeem_rollback_failed', { rewardId: r.id, rollbackErr })
          }
          return NextResponse.json(
            {
              error:
                'Redemption was rolled back because the loyalty record could not be reset. Ask the customer to contact support.',
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Voucher redeemed successfully',
        reward: {
          id: r.id,
          description: r.description,
          value: r.value,
          category: r.category,
          punch_kind: punchKind ?? null,
          customer: singleJoinedCustomer(r.customer),
        },
      })
    } catch (error) {
      log.error('Error in voucher redemption:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: redeemVoucherSchema,
    auditAction: 'update',
    auditResourceType: 'reward',
  }
)

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const raw = searchParams.get('code') || ''
      const voucherCode = normalizeVoucherCode(raw)

      if (!voucherCode) {
        return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 })
      }

      const supabase = await createClient()

      const { data: reward, error } = await supabase
        .from('enhanced_rewards')
        .select(
          `
        *,
        customer:customers(id, name, email)
      `
        )
        .eq('redemption_code', voucherCode)
        .single()

      if (error || !reward) {
        return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
      }

      const isExpired = new Date(reward.expires_at as string) < new Date()
      const isUsed = reward.claimed as boolean

      return NextResponse.json({
        voucher: {
          code: voucherCode,
          description: reward.description,
          value: reward.value,
          category: reward.category,
          punch_kind: (reward as { punch_kind?: string | null }).punch_kind ?? null,
          customer: singleJoinedCustomer(
            (reward as { customer?: CustomerBrief | CustomerBrief[] | null }).customer
          ),
          expires_at: reward.expires_at,
          claimed: reward.claimed,
          claimed_at: reward.claimed_at,
          isExpired,
          isUsed,
          isValid: !isExpired && !isUsed,
        },
      })
    } catch (error) {
      log.error('Error checking voucher status:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'reward',
  }
)
