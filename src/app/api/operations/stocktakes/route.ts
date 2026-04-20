import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import {
  summarizeStocktakeVariance,
  type StocktakeVarianceRow,
} from '@/lib/operations/inventory-variance'

const createStocktakeSchema = z.object({
  inventory_id: z.string().uuid(),
  counted_quantity: z.number().int().nonnegative(),
  expected_quantity: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'counted']).optional(),
})

export const GET = withSecurity(
  async (req, { scopedLocationId }) => {
    const supabase = await createClient()
    const varianceOnly = new URL(req.url).searchParams.get('variance_only') === '1'
    const invSelect = scopedLocationId
      ? '*, inventory!inner(id, name, category, location_id)'
      : '*, inventory(id, name, category)'
    let query = supabase.from('stocktakes').select(invSelect).order('counted_at', { ascending: false })
    if (scopedLocationId) {
      query = query.eq('inventory.location_id', scopedLocationId)
    }
    if (varianceOnly) {
      query = query.neq('variance', 0)
    }
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rows = data || []
    const summary = varianceOnly ? summarizeStocktakeVariance(rows as StocktakeVarianceRow[]) : undefined
    return NextResponse.json({ data: rows, summary })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'inventory.read',
    requireLocationScoped: true,
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'inventory',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createStocktakeSchema>
    const supabase = await createClient()
    if (scopedLocationId) {
      const { data: inv, error: invErr } = await supabase
        .from('inventory')
        .select('location_id')
        .eq('id', body.inventory_id)
        .single()
      if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })
      const loc = inv?.location_id as string | null | undefined
      if (loc && loc !== scopedLocationId) {
        return NextResponse.json({ error: 'Inventory belongs to a different location' }, { status: 403 })
      }
    }
    const { status, ...rest } = body
    const { data, error } = await supabase
      .from('stocktakes')
      .insert([{ ...rest, status: status ?? 'counted' }])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'inventory.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createStocktakeSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
