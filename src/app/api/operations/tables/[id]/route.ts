import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { countOpenOrdersByTableId } from '@/lib/operations/tables-usage'

const patchTableSchema = z
  .object({
    section_id: z.string().uuid().nullable().optional(),
    table_number: z.string().min(1).max(50).optional(),
    capacity: z.number().int().positive().max(200).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' })

export const PATCH = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof patchTableSchema>
    const supabase = await createClient()

    if (body.is_active === false) {
      const usage = await countOpenOrdersByTableId(supabase, [params.id])
      const n = usage.get(params.id) ?? 0
      if (n > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate table with ${n} open order(s). Close or void orders first.` },
          { status: 409 }
        )
      }
    }

    if (body.section_id) {
      const { data: sec, error: secErr } = await supabase
        .from('floor_sections')
        .select('id')
        .eq('id', body.section_id)
        .maybeSingle()
      if (secErr) return NextResponse.json({ error: secErr.message }, { status: 500 })
      if (!sec?.id) {
        return NextResponse.json({ error: 'Unknown floor section' }, { status: 400 })
      }
    }

    const patch: Record<string, unknown> = {}
    if (body.section_id !== undefined) patch.section_id = body.section_id
    if (body.table_number !== undefined) patch.table_number = body.table_number.trim()
    if (body.capacity !== undefined) patch.capacity = body.capacity
    if (body.is_active !== undefined) patch.is_active = body.is_active
    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('venue_tables')
      .update(patch)
      .eq('id', params.id)
      .select('*, floor_sections(id, name, location_id)')
      .single()

    if (error) {
      if (String(error.message || '').toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'Table number already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    requirePermission: 'locations.write',
    rateLimitType: 'strict',
    validateBody: patchTableSchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)
