import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { commitStocktake } from '@/lib/operations/stocktakes'
import { recordSliEvent } from '@/lib/observability/sli'

const commitBodySchema = z.object({})

export const POST = withSecurity(
  async (_req, { routeContext, user }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()

    try {
      await commitStocktake({ supabase, stocktakeId: params.id, actorProfileId: user.profileId })
      const { data, error } = await supabase.from('stocktakes').select('*').eq('id', params.id).single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      recordSliEvent('stocktake_committed', true)
      return NextResponse.json({ data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Commit failed' },
        { status: 400 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'inventory.write',
    rateLimitType: 'strict',
    validateBody: commitBodySchema,
    auditAction: 'update',
    auditResourceType: 'inventory',
  }
)
