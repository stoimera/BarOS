import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import type { IntegrationPluginId } from '@/lib/integrations/plugins'

const TABLE = 'integration_plugin_settings'

const IDS: IntegrationPluginId[] = ['stripe', 'twilio', 'resend', 'google_reviews']

const patchSchema = z
  .object({
    stripe: z.boolean().optional(),
    twilio: z.boolean().optional(),
    resend: z.boolean().optional(),
    google_reviews: z.boolean().optional(),
  })
  .refine((o) => IDS.some((id) => o[id] !== undefined), { message: 'Provide at least one plugin boolean' })

export const PATCH = withSecurity(
  async (_req, { validatedBody }) => {
    const body = validatedBody as z.infer<typeof patchSchema>
    const supabase = await createClient()
    const now = new Date().toISOString()
    for (const id of IDS) {
      if (body[id] === undefined) continue
      const { error } = await supabase
        .from(TABLE)
        .upsert({ plugin_id: id, enabled: body[id]!, updated_at: now }, { onConflict: 'plugin_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: patchSchema,
    auditAction: 'update',
    auditResourceType: 'organization',
  }
)

export const DELETE = withSecurity(
  async (req: NextRequest, _ctx) => {
    const id = req.nextUrl.searchParams.get('plugin_id') as IntegrationPluginId | null
    if (!id || !IDS.includes(id)) {
      return NextResponse.json({ error: 'Invalid or missing plugin_id query param' }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase.from(TABLE).delete().eq('plugin_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: id })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'organization',
  }
)
