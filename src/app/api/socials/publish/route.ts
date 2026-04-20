import { NextRequest, NextResponse } from 'next/server'
import { publishSocialPost, SocialPlatform, PublishSocialPostResult } from '@/lib/socialPublishing'
import { requireAdmin } from '@/lib/server/socialAuth'
import { getActiveConnectionMap } from '@/lib/server/socialConnections'

interface PublishBody {
  content?: string
  imageUrl?: string
  scheduledAt?: string
  platforms?: SocialPlatform[]
}

function isPlatform(value: string): value is SocialPlatform {
  return value === 'facebook' || value === 'instagram' || value === 'tiktok'
}

function normalizePlatforms(platforms: unknown): SocialPlatform[] {
  if (!Array.isArray(platforms)) {
    return []
  }

  const normalized = platforms
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase())
    .filter(isPlatform)

  return [...new Set(normalized)]
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const supabase = auth.data.supabase
    const body = (await req.json()) as PublishBody
    const connectionMap = await getActiveConnectionMap(supabase)

    const content = body.content?.trim() ?? ''
    const imageUrl = body.imageUrl?.trim() || undefined
    const scheduledAt = body.scheduledAt?.trim() || undefined
    const platforms = normalizePlatforms(body.platforms)

    if (!content) {
      return NextResponse.json({ error: 'Post content is required.' }, { status: 400 })
    }

    if (platforms.length === 0) {
      return NextResponse.json({ error: 'Select at least one platform.' }, { status: 400 })
    }

    const disconnected = platforms.filter((platform) => !connectionMap.has(platform))
    if (disconnected.length > 0) {
      return NextResponse.json(
        {
          error: `Missing active connection for: ${disconnected.join(', ')}.`,
        },
        { status: 400 }
      )
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
    const hasValidScheduledDate = Boolean(scheduledDate && !Number.isNaN(scheduledDate.getTime()))
    const isScheduled = Boolean(
      hasValidScheduledDate && scheduledDate && scheduledDate.getTime() > Date.now()
    )

    if (scheduledAt && !hasValidScheduledDate) {
      return NextResponse.json({ error: 'Invalid schedule date.' }, { status: 400 })
    }

    if (isScheduled && scheduledDate) {
      const rows = platforms.map((platform) => ({
        platform,
        content,
        media_urls: imageUrl ? [imageUrl] : [],
        scheduled_at: scheduledDate.toISOString(),
        status: 'scheduled',
        created_by: auth.data.profileId,
      }))

      const { data, error } = await supabase
        .from('social_posts')
        .insert(rows)
        .select('id, platform, status, scheduled_at')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ mode: 'scheduled', results: data ?? [] })
    }

    const publishResults: PublishSocialPostResult[] = await Promise.all(
      platforms.map((platform) =>
        publishSocialPost({
          platform,
          content,
          imageUrl,
          credentials: connectionMap.get(platform),
        })
      )
    )

    const rows = publishResults.map((result) => ({
      platform: result.platform,
      content,
      media_urls: imageUrl ? [imageUrl] : [],
      posted_at: result.success ? new Date().toISOString() : null,
      status: result.success ? 'posted' : 'failed',
      created_by: auth.data.profileId,
      external_post_id: result.externalPostId ?? null,
      error_message: result.error ?? null,
    }))

    const { data: persistedRows, error: persistError } = await supabase
      .from('social_posts')
      .insert(rows)
      .select('id, platform, status, posted_at')

    if (persistError) {
      return NextResponse.json({ error: persistError.message }, { status: 500 })
    }

    const mergedResults = publishResults.map((result, index) => ({
      ...result,
      recordId: persistedRows?.[index]?.id ?? null,
    }))

    const hasFailure = mergedResults.some((result) => !result.success)
    return NextResponse.json(
      { mode: 'immediate', results: mergedResults },
      { status: hasFailure ? 207 : 200 }
    )
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 })
  }
}
