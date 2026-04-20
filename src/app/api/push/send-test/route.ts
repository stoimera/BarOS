import { NextResponse } from 'next/server'
import { z } from 'zod'
import webpush from 'web-push'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'

const bodySchema = z.object({
  title: z.string().max(120).optional(),
  body: z.string().max(500).optional(),
  url: z.string().max(500).optional(),
})

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
    const subject = process.env.VAPID_SUBJECT_MAILTO?.trim() || 'mailto:ops@urban-lounge.local'

    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 503 })
    }

    const body = validatedBody as z.infer<typeof bodySchema>
    const supabase = await createClient()

    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('profile_id', user.profileId)
      .limit(5)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows?.length) {
      return NextResponse.json({ error: 'No push subscription for this account' }, { status: 400 })
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)

    const payload = JSON.stringify({
      title: body.title ?? 'Urban Lounge',
      body: body.body ?? 'Test notification',
      url: body.url ?? '/dashboard',
    })

    let sent = 0
    const errors: string[] = []
    for (const row of rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint as string,
            keys: { p256dh: row.p256dh as string, auth: row.auth as string },
          },
          payload,
          { TTL: 60 }
        )
        sent += 1
      } catch (e) {
        errors.push(e instanceof Error ? e.message : 'send failed')
      }
    }

    return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: bodySchema,
    auditAction: 'create',
    auditResourceType: 'user',
  }
)
