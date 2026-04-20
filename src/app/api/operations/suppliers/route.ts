import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const createSupplierSchema = z.object({
  name: z.string().min(1),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().min(3).max(40),
})

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof createSupplierSchema>
    const supabase = await createClient()
    const row = {
      name: body.name.trim(),
      contact_name: body.contact_name?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      contact_phone: body.contact_phone.trim(),
    }
    const { data, error } = await supabase.from('suppliers').insert([row]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    rateLimitType: 'strict',
    validateBody: createSupplierSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
