import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

export const POST = withSecurity(
  async (req, { validatedBody, user }) => {
    const body = validatedBody as z.infer<typeof subscribeSchema>
    const supabase = await createClient()
    const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        profile_id: user.profileId,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        user_agent: ua,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: subscribeSchema,
    auditAction: 'create',
    auditResourceType: 'user',
  }
)

const unsubscribeQuery = z.object({
  endpoint: z.string().url(),
})

export const DELETE = withSecurity(
  async (req, { user }) => {
    const url = new URL(req.url)
    const parsed = unsubscribeQuery.safeParse({ endpoint: url.searchParams.get('endpoint') || '' })
    if (!parsed.success) {
      return NextResponse.json({ error: 'endpoint query required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', parsed.data.endpoint)
      .eq('profile_id', user.profileId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'user',
  }
)
