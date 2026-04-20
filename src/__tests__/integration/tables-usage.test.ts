/**
 * @jest-environment node
 */
import { countOpenOrdersByTableId } from '@/lib/operations/tables-usage'

describe('countOpenOrdersByTableId (Track 10.1)', () => {
  it('aggregates counts per table_id', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: async () => ({
              data: [{ table_id: 't1' }, { table_id: 't1' }, { table_id: 't2' }],
              error: null,
            }),
          }),
        }),
      }),
    }
    const m = await countOpenOrdersByTableId(supabase as never, ['t1', 't2'])
    expect(m.get('t1')).toBe(2)
    expect(m.get('t2')).toBe(1)
  })

  it('returns empty map for empty ids', async () => {
    const supabase = { from: () => ({}) }
    const m = await countOpenOrdersByTableId(supabase as never, [])
    expect(m.size).toBe(0)
  })
})
