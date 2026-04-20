import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * When a recipe exists for a sold menu item, deplete ingredient inventory and log movements (Track 4.6).
 * Returns true if a recipe was applied (legacy POS inventory-id path should be skipped for that line).
 */
export async function depleteRecipeForOrderItem(params: {
  supabase: SupabaseClient
  menuItemId: string
  quantitySold: number
  orderId: string
}): Promise<boolean> {
  const { supabase, menuItemId, quantitySold, orderId } = params
  if (quantitySold <= 0) return false

  const { data: recipe, error: rErr } = await supabase
    .from('recipes')
    .select('id')
    .eq('output_menu_item_id', menuItemId)
    .maybeSingle()
  if (rErr) throw rErr
  if (!recipe?.id) return false

  const { data: ingredients, error: iErr } = await supabase
    .from('recipe_ingredients')
    .select('inventory_id, units_per_sale')
    .eq('recipe_id', recipe.id)
  if (iErr) throw iErr
  if (!ingredients?.length) return false

  for (const ing of ingredients) {
    const units = Number(ing.units_per_sale) * quantitySold
    const take = Math.ceil(units)

    const { data: inv, error: invErr } = await supabase
      .from('inventory')
      .select('current_stock')
      .eq('id', ing.inventory_id)
      .single()
    if (invErr) throw invErr
    const prev = Number(inv?.current_stock ?? 0)
    const next = Math.max(0, prev - take)

    const { error: uErr } = await supabase.from('inventory').update({ current_stock: next }).eq('id', ing.inventory_id)
    if (uErr) throw uErr

    const { error: mErr } = await supabase.from('stock_movements').insert({
      inventory_id: ing.inventory_id,
      quantity_delta: -take,
      movement_type: 'recipe_depletion',
      reference_type: 'order',
      reference_id: orderId,
      metadata: {
        menu_item_id: menuItemId,
        recipe_id: recipe.id,
        units_per_sale: ing.units_per_sale,
        quantity_sold: quantitySold,
      },
    })
    if (mErr) throw mErr
  }

  return true
}
