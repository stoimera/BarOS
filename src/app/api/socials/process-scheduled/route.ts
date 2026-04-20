import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publishSocialPost, SocialPlatform } from '@/lib/socialPublishing'
import { getActiveConnectionMap } from '@/lib/server/socialConnections'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

type ScheduledRow = {
  id: string
  platform: SocialPlatform
  content: string
  media_urls: string[] | null
}

const processScheduledPostsSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
})

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SOCIALS_SCHEDULER_SECRET
  if (!secret) {
    return false
  }
  const authHeader = req.headers.get('authorization') ?? ''
  return authHeader === `Bearer ${secret}`
}

export const POST = withSecurity(
  async (req) => {
    if (!isAuthorized(req as NextRequest)) {
      return NextResponse.json({ error: 'Unauthorized scheduler request' }, { status: 401 })
    }

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {
              // No-op in cron route
            },
          },
        }
      )
      const connectionMap = await getActiveConnectionMap(supabase)

      const { data, error } = await supabase
        .from('social_posts')
        .select('id, platform, content, media_urls')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(50)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const posts = (data ?? []) as ScheduledRow[]
      const results = await Promise.all(
        posts.map(async (post) => {
          const credentials = connectionMap.get(post.platform)
          if (!credentials) {
            await supabase
              .from('social_posts')
              .update({ status: 'failed', error_message: 'Platform is not connected.' })
              .eq('id', post.id)
            return { id: post.id, platform: post.platform, success: false, error: 'Not connected' }
          }

          const imageUrl = post.media_urls?.[0]
          const publishResult = await publishSocialPost({
            platform: post.platform,
            content: post.content,
            imageUrl,
            credentials,
          })

          await supabase
            .from('social_posts')
            .update({
              status: publishResult.success ? 'posted' : 'failed',
              posted_at: publishResult.success ? new Date().toISOString() : null,
              external_post_id: publishResult.externalPostId ?? null,
              error_message: publishResult.error ?? null,
            })
            .eq('id', post.id)

          return {
            id: post.id,
            platform: post.platform,
            success: publishResult.success,
            error: publishResult.error,
          }
        })
      )

      return NextResponse.json({
        processed: results.length,
        success: results.filter((item) => item.success).length,
        failed: results.filter((item) => !item.success).length,
        results,
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process scheduled posts' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: processScheduledPostsSchema,
    auditAction: 'update',
    auditResourceType: 'task',
  }
)
