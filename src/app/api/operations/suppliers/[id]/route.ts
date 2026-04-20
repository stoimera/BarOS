import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contact_name: z.string().max(200).optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
})

const emptyBodySchema = z.object({})

export const GET = withSecurity(
  async (_req, { routeContext }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', params.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
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

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof updateSupplierSchema>
    const supabase = await createClient()
    const { data, error } = await supabase.from('suppliers').update(body).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    rateLimitType: 'strict',
    validateBody: updateSupplierSchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)

export const DELETE = withSecurity(
  async (_req, { routeContext }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()
    const { error } = await supabase.from('suppliers').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'procurement.write',
    rateLimitType: 'strict',
    validateBody: emptyBodySchema,
    auditAction: 'delete',
    auditResourceType: 'inventory',
  }
)
