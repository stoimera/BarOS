import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const redeemSchema = z.object({
  plain_code: z.string().min(6).max(64),
  amount_cents: z.number().int().positive(),
})

function hashCode(plain: string) {
  return createHash('sha256').update(plain, 'utf8').digest('hex')
}

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof redeemSchema>
    const supabase = await createClient()
    const code_hash = hashCode(body.plain_code)
    const { data: card, error: findErr } = await supabase
      .from('gift_cards')
      .select('id, balance_cents, status')
      .eq('code_hash', code_hash)
      .single()
    if (findErr || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    const row = card as { id: string; balance_cents: number; status: string }
    if (row.status !== 'active') {
      return NextResponse.json({ error: 'Card is not active' }, { status: 400 })
    }
    if (row.balance_cents < body.amount_cents) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    const nextBal = row.balance_cents - body.amount_cents
    const nextStatus = nextBal <= 0 ? 'redeemed' : 'active'
    const { data, error } = await supabase
      .from('gift_cards')
      .update({
        balance_cents: nextBal < 0 ? 0 : nextBal,
        status: nextStatus,
      })
      .eq('id', row.id)
      .select('id, balance_cents, status')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    rateLimitType: 'strict',
    validateBody: redeemSchema,
    auditAction: 'update',
    auditResourceType: 'customer',
  }
)
