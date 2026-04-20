import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { createLogger } from '@/lib/logger'
import { applyInventoryWasteToStockAndLedger } from '@/lib/operations/inventory-waste-ledger'
import { z } from 'zod'

const log = createLogger('api.operations.inventory-waste')

const createWasteSchema = z.object({
  inventory_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().min(3),
})

export const GET = withSecurity(
  async (_req, { scopedLocationId }) => {
    const supabase = await createClient()
    const invSelect = scopedLocationId
      ? '*, inventory!inner(id, name, category, location_id)'
      : '*, inventory(id, name, category)'
    let q = supabase.from('inventory_waste').select(invSelect).order('created_at', { ascending: false })
    if (scopedLocationId) {
      q = q.eq('inventory.location_id', scopedLocationId)
    }
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
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
  async (_req, { validatedBody, user, scopedLocationId }) => {
    const body = validatedBody as z.infer<typeof createWasteSchema>
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
    const { data, error } = await supabase.from('inventory_waste').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await applyInventoryWasteToStockAndLedger({
        supabase,
        wasteRowId: data.id,
        inventoryId: body.inventory_id,
        quantity: body.quantity,
        reason: body.reason,
        actorProfileId: user.profileId,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ledger update failed'
      log.warn('inventory_waste_ledger_failed', { message: msg })
      await supabase.from('inventory_waste').delete().eq('id', data.id)
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'inventory.write',
    requireLocationScoped: true,
    rateLimitType: 'strict',
    validateBody: createWasteSchema,
    auditAction: 'create',
    auditResourceType: 'inventory',
  }
)
