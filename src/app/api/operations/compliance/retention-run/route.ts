import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const retentionRunSchema = z
  .object({
    run_type: z.enum(['scheduled_review', 'manual_audit', 'dsar_archive']),
    scope_summary: z.string().min(1).max(4000),
    acknowledge_dangerous_action: z.literal(true),
    acknowledge_irreversibility: z.literal(true),
  })
  .strict()

export const POST = withSecurity(
  async (_req, { user, validatedBody }) => {
    const body = validatedBody as z.infer<typeof retentionRunSchema>
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('compliance_retention_runs')
      .insert({
        run_type: body.run_type,
        scope_summary: body.scope_summary,
        metadata: {
          acknowledged_at: new Date().toISOString(),
        },
        created_by_profile_id: user.profileId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    requirePermission: 'compliance.write',
    rateLimitType: 'strict',
    validateBody: retentionRunSchema,
    auditAction: 'create',
    auditResourceType: 'compliance_retention_run',
  }
)
