import { createServiceRoleClient } from '@/utils/supabase/service-role'

export type TipPoolType = 'staff' | 'kitchen' | 'house'

export async function recordTipPoolEntry(params: {
  orderId: string | null
  amount: number
  poolType: TipPoolType
}) {
  if (params.amount < 0) throw new Error('Tip amount must be non-negative')

  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('tip_pool_entries')
    .insert({
      order_id: params.orderId,
      amount: params.amount,
      pool_type: params.poolType,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
