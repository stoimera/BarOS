import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const createModifierSchema = z.object({
  name: z.string().min(1).max(120),
  price_delta: z.number().optional(),
})

const linkSchema = z.object({
  menu_item_id: z.string().uuid(),
  modifier_id: z.string().uuid(),
})

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data: modifiers, error: mErr } = await supabase
      .from('menu_modifiers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
    const { data: links, error: lErr } = await supabase.from('menu_item_modifiers').select('menu_item_id, modifier_id')
    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })
    return NextResponse.json({ data: { modifiers: modifiers || [], links: links || [] } })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'menu_item',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof createModifierSchema> | z.infer<typeof linkSchema>
    const supabase = await createClient()
    if ('menu_item_id' in body && 'modifier_id' in body) {
      const { data, error } = await supabase.from('menu_item_modifiers').insert(body).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data, kind: 'link' })
    }
    const mod = body as z.infer<typeof createModifierSchema>
    const { data, error } = await supabase
      .from('menu_modifiers')
      .insert({ name: mod.name, price_delta: mod.price_delta ?? 0 })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, kind: 'modifier' })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.write',
    rateLimitType: 'strict',
    validateBody: z.union([createModifierSchema, linkSchema]),
    auditAction: 'create',
    auditResourceType: 'menu_item',
  }
)
