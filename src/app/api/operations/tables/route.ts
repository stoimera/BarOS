import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { countOpenOrdersByTableId } from '@/lib/operations/tables-usage'

const createTableSchema = z.object({
  section_id: z.string().uuid().nullable().optional(),
  table_number: z.string().min(1).max(50),
  capacity: z.number().int().positive().max(200),
  is_active: z.boolean().optional(),
})

export const GET = withSecurity(
  async (req, { scopedLocationId }) => {
    const supabase = await createClient()
    const includeUsage = new URL(req.url).searchParams.get('include_usage') === '1'

    const { data, error } = await supabase
      .from('venue_tables')
      .select('*, floor_sections(id, name, location_id)')
      .order('table_number', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let rows = data || []
    if (scopedLocationId) {
      rows = rows.filter((r) => {
        const loc = (r as { floor_sections?: { location_id?: string | null } | null }).floor_sections
          ?.location_id
        return loc === scopedLocationId
      })
    }
    let payload: unknown[] = rows

    if (includeUsage && rows.length > 0) {
      const ids = rows.map((r) => (r as { id: string }).id).filter(Boolean)
      const usage = await countOpenOrdersByTableId(supabase, ids)
      payload = rows.map((r) => {
        const row = r as { id: string }
        const n = usage.get(row.id) ?? 0
        return {
          ...row,
          open_orders_count: n,
          multi_order_warning: n > 1,
        }
      })
    }

    return NextResponse.json({ data: payload })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof createTableSchema>
    const supabase = await createClient()

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

    const { data, error } = await supabase
      .from('venue_tables')
      .insert([
        {
          section_id: body.section_id ?? null,
          table_number: body.table_number.trim(),
          capacity: body.capacity,
          is_active: body.is_active ?? true,
        },
      ])
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
    validateBody: createTableSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
