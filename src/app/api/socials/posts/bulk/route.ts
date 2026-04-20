import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/socialAuth'
import { getActiveConnectionMap } from '@/lib/server/socialConnections'
import { publishSocialPost, SocialPlatform } from '@/lib/socialPublishing'

type BulkAction = 'publish_now' | 'delete' | 'reschedule'

interface BulkBody {
  action?: BulkAction
  ids?: string[]
  scheduledAt?: string
}

interface ScheduledPostRow {
  id: string
  platform: SocialPlatform
  content: string
  media_urls: string[] | null
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await req.json()) as BulkBody
    const action = body.action
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []

    if (!action || !['publish_now', 'delete', 'reschedule'].includes(action)) {
      return NextResponse.json({ error: 'Invalid bulk action.' }, { status: 400 })
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No post IDs provided.' }, { status: 400 })
    }

    if (action === 'delete') {
      const { error } = await auth.data.supabase
        .from('social_posts')
        .delete()
        .in('id', ids)
        .eq('status', 'scheduled')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === 'reschedule') {
      const scheduledAt = body.scheduledAt?.trim()
      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'scheduledAt is required for reschedule.' },
          { status: 400 }
        )
      }
      const scheduledDate = new Date(scheduledAt)
      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledAt.' }, { status: 400 })
      }

      const { error } = await auth.data.supabase
        .from('social_posts')
        .update({
          scheduled_at: scheduledDate.toISOString(),
          status: 'scheduled',
          posted_at: null,
          error_message: null,
        })
        .in('id', ids)
        .eq('status', 'scheduled')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, updated: ids.length })
    }

    const { data, error } = await auth.data.supabase
      .from('social_posts')
      .select('id, platform, content, media_urls')
      .in('id', ids)
      .eq('status', 'scheduled')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const posts = (data ?? []) as ScheduledPostRow[]
    const connectionMap = await getActiveConnectionMap(auth.data.supabase)

    const results = await Promise.all(
      posts.map(async (post) => {
        const credentials = connectionMap.get(post.platform)
        if (!credentials) {
          await auth.data.supabase
            .from('social_posts')
            .update({ status: 'failed', error_message: 'Platform not connected.' })
            .eq('id', post.id)
          return { id: post.id, success: false, error: 'Platform not connected.' }
        }

        const publishResult = await publishSocialPost({
          platform: post.platform,
          content: post.content,
          imageUrl: post.media_urls?.[0],
          credentials,
        })

        await auth.data.supabase
          .from('social_posts')
          .update({
            status: publishResult.success ? 'posted' : 'failed',
            posted_at: publishResult.success ? new Date().toISOString() : null,
            external_post_id: publishResult.externalPostId ?? null,
            error_message: publishResult.error ?? null,
          })
          .eq('id', post.id)

        return { id: post.id, success: publishResult.success, error: publishResult.error }
      })
    )

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk queue action failed.' },
      { status: 500 }
    )
  }
}
