import { NextRequest, NextResponse } from 'next/server'
import { SocialPlatform } from '@/lib/socialPublishing'
import { requireAdmin } from '@/lib/server/socialAuth'
import {
  disconnectSocialConnection,
  listSocialConnections,
  upsertSocialConnection,
} from '@/lib/server/socialConnections'

interface ConnectionBody {
  platform?: SocialPlatform
  accessToken?: string
  pageId?: string
  accountId?: string
  webhookUrl?: string
}

function isPlatform(value: unknown): value is SocialPlatform {
  return value === 'facebook' || value === 'instagram' || value === 'tiktok'
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const connections = await listSocialConnections(auth.data.supabase)
    const sanitized = connections.map((item) => ({
      platform: item.platform,
      connected: item.connected,
      updatedAt: item.updatedAt,
      hasAccessToken: Boolean(item.config.accessToken),
      hasPageId: Boolean(item.config.pageId),
      hasAccountId: Boolean(item.config.accountId),
      hasWebhookUrl: Boolean(item.config.webhookUrl),
    }))
    return NextResponse.json({ connections: sanitized })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await req.json()) as ConnectionBody
    if (!isPlatform(body.platform)) {
      return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 })
    }

    if (body.platform === 'facebook' && (!body.accessToken || !body.pageId)) {
      return NextResponse.json(
        { error: 'Facebook requires page ID and access token.' },
        { status: 400 }
      )
    }

    if (body.platform === 'instagram' && (!body.accessToken || !body.accountId)) {
      return NextResponse.json(
        { error: 'Instagram requires account ID and access token.' },
        { status: 400 }
      )
    }

    if (body.platform === 'tiktok' && !body.webhookUrl) {
      return NextResponse.json({ error: 'TikTok requires a publish webhook URL.' }, { status: 400 })
    }

    await upsertSocialConnection(auth.data.supabase, body.platform, {
      accessToken: body.accessToken?.trim() || undefined,
      pageId: body.pageId?.trim() || undefined,
      accountId: body.accountId?.trim() || undefined,
      webhookUrl: body.webhookUrl?.trim() || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')

    if (!isPlatform(platform)) {
      return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 })
    }

    await disconnectSocialConnection(auth.data.supabase, platform)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
