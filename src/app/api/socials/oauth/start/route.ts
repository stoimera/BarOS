import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/socialAuth'

type Platform = 'facebook' | 'instagram' | 'tiktok'

function isPlatform(value: string | null): value is Platform {
  return value === 'facebook' || value === 'instagram' || value === 'tiktok'
}

function getRedirectUri(): string {
  return (
    process.env.SOCIALS_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/socials/oauth/callback'
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform')

  if (!isPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 })
  }

  const redirectUri = encodeURIComponent(getRedirectUri())
  let authorizeUrl = ''

  if (platform === 'facebook' || platform === 'instagram') {
    const appId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID
    if (!appId) {
      return NextResponse.json({ error: 'Missing Facebook/Instagram app ID.' }, { status: 400 })
    }
    const scope =
      platform === 'facebook'
        ? 'pages_manage_posts,pages_read_engagement'
        : 'instagram_basic,instagram_content_publish,pages_show_list'
    authorizeUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
      scope
    )}&response_type=code&state=${encodeURIComponent(platform)}`
  } else {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    if (!clientKey) {
      return NextResponse.json({ error: 'Missing TikTok client key.' }, { status: 400 })
    }
    const scope = 'user.info.basic,video.publish'
    authorizeUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(
      scope
    )}&response_type=code&state=${encodeURIComponent(platform)}`
  }

  return NextResponse.json({ authorizeUrl })
}
