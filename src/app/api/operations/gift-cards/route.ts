import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const issueSchema = z.object({
  initial_cents: z.number().int().positive(),
  plain_code: z.string().min(6).max(64),
  currency: z.string().length(3).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
})

function hashCode(plain: string) {
  return createHash('sha256').update(plain, 'utf8').digest('hex')
}

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gift_cards')
      .select('id, balance_cents, currency, status, issued_at, expires_at, customer_id')
      .order('issued_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'customer',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = validatedBody as z.infer<typeof issueSchema>
    const supabase = await createClient()
    const code_hash = hashCode(body.plain_code)
    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        code_hash,
        balance_cents: body.initial_cents,
        currency: body.currency ?? 'EUR',
        customer_id: body.customer_id ?? null,
        expires_at: body.expires_at ?? null,
        status: 'active',
      })
      .select('id, balance_cents, currency, status, issued_at, expires_at, customer_id')
      .single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Duplicate card code hash' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data, note: 'Store plain_code only for the purchaser; it is not persisted.' })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.settle',
    rateLimitType: 'strict',
    validateBody: issueSchema,
    auditAction: 'create',
    auditResourceType: 'customer',
  }
)
