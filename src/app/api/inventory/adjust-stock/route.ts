import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { StockAdjustmentData } from '@/types/inventory'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.inventory.adjust-stock')

const stockAdjustmentSchema = z.object({
  item_id: z.string().uuid(),
  change: z.number().int(),
  reason: z.enum(['purchase', 'usage', 'correction', 'waste']),
  notes: z.string().optional(),
})

export const POST = withSecurity<StockAdjustmentData>(
  async (request, { user, validatedBody }) => {
    try {
      log.info('Inventory API: POST /adjust-stock request received')

      const adjustmentData: StockAdjustmentData = validatedBody as StockAdjustmentData

      if (!adjustmentData.item_id || adjustmentData.change === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const supabase = await createClient()

      // Get the profile ID for the current user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        log.error('Inventory API: Failed to get user profile:', profileError)
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      // Get current inventory item to calculate previous and new quantities
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('id', adjustmentData.item_id)
        .single()

      if (fetchError) {
        log.error('Inventory API: Failed to fetch inventory item:', fetchError)
        return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
      }

      const previousQuantity = currentItem.current_stock
      const newQuantity = previousQuantity + adjustmentData.change

      // Validate that the new quantity won't be negative
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: 'Stock adjustment would result in negative quantity' },
          { status: 400 }
        )
      }

      // Update the inventory item
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ current_stock: newQuantity })
        .eq('id', adjustmentData.item_id)

      if (updateError) {
        log.error('Inventory API: Failed to update inventory:', updateError)
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
      }

      // Create the log entry
      const { data: inventoryLogRow, error: logError } = await supabase
        .from('logs_inventory')
        .insert([
          {
            inventory_id: adjustmentData.item_id,
            action: 'adjust',
            quantity_change: adjustmentData.change,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: adjustmentData.reason,
            notes: adjustmentData.notes,
            performed_by: profile.id,
          },
        ])
        .select()
        .single()

      if (logError) {
        log.error('Inventory API: Failed to create log entry:', logError)
        return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
      }

      log.info('Inventory API: Stock adjustment successful')
      return NextResponse.json(inventoryLogRow)
    } catch (error) {
      log.error('Inventory API: Error in adjust-stock:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: stockAdjustmentSchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)
