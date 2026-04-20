import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/socialAuth'
import { upsertSocialConnection } from '@/lib/server/socialConnections'
import { SocialPlatform } from '@/lib/socialPublishing'

interface FacebookTokenResponse {
  access_token?: string
  error?: { message?: string }
}

interface FacebookPagesResponse {
  data?: Array<{
    id: string
    access_token?: string
    instagram_business_account?: { id: string }
  }>
}

interface TikTokTokenResponse {
  access_token?: string
  error?: { message?: string }
}

function getRedirectUri(): string {
  return (
    process.env.SOCIALS_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/socials/oauth/callback'
  )
}

function toDashboardSocialsUrl(req: NextRequest, query: string): URL {
  return new URL(`/socials${query}`, req.url)
}

async function exchangeFacebookCodeForToken(code: string): Promise<string> {
  const appId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('Missing Facebook app credentials.')
  }

  const url =
    `https://graph.facebook.com/v22.0/oauth/access_token` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(getRedirectUri())}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&code=${encodeURIComponent(code)}`

  const response = await fetch(url, { method: 'GET' })
  const payload = (await response.json()) as FacebookTokenResponse
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error?.message ?? 'Failed to exchange Facebook auth code.')
  }
  return payload.access_token
}

async function getFacebookPages(accessToken: string): Promise<FacebookPagesResponse> {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,access_token,instagram_business_account&access_token=${encodeURIComponent(
      accessToken
    )}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages.')
  }
  return (await response.json()) as FacebookPagesResponse
}

async function exchangeTikTokCodeForToken(code: string): Promise<string> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    throw new Error('Missing TikTok OAuth credentials.')
  }

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
    }),
  })

  const payload = (await response.json()) as TikTokTokenResponse
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error?.message ?? 'Failed to exchange TikTok auth code.')
  }
  return payload.access_token
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.redirect(toDashboardSocialsUrl(req, '?oauth=forbidden'))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  const platform = (state as SocialPlatform | null) ?? null
  if (!platform || !['facebook', 'instagram', 'tiktok'].includes(platform)) {
    return NextResponse.redirect(toDashboardSocialsUrl(req, '?oauth=invalid_state'))
  }

  if (error) {
    return NextResponse.redirect(
      toDashboardSocialsUrl(req, `?oauth=error&reason=${encodeURIComponent(error)}`)
    )
  }

  if (!code) {
    return NextResponse.redirect(toDashboardSocialsUrl(req, '?oauth=missing_code'))
  }

  try {
    if (platform === 'facebook') {
      const userToken = await exchangeFacebookCodeForToken(code)
      const pages = await getFacebookPages(userToken)
      const page = pages.data?.[0]
      if (!page?.id || !page.access_token) {
        throw new Error('No Facebook page found for this account.')
      }

      await upsertSocialConnection(auth.data.supabase, 'facebook', {
        pageId: page.id,
        accessToken: page.access_token,
      })
    }

    if (platform === 'instagram') {
      const userToken = await exchangeFacebookCodeForToken(code)
      const pages = await getFacebookPages(userToken)
      const withInstagram = pages.data?.find((page) => page.instagram_business_account?.id)
      if (!withInstagram?.instagram_business_account?.id || !withInstagram.access_token) {
        throw new Error('No Instagram business account connected to your Facebook page.')
      }

      await upsertSocialConnection(auth.data.supabase, 'instagram', {
        accountId: withInstagram.instagram_business_account.id,
        accessToken: withInstagram.access_token,
      })
    }

    if (platform === 'tiktok') {
      const token = await exchangeTikTokCodeForToken(code)
      await upsertSocialConnection(auth.data.supabase, 'tiktok', {
        accessToken: token,
        webhookUrl: process.env.TIKTOK_PUBLISH_WEBHOOK_URL,
      })
    }

    return NextResponse.redirect(
      toDashboardSocialsUrl(req, `?oauth=connected&platform=${platform}`)
    )
  } catch (exchangeError) {
    const message =
      exchangeError instanceof Error ? exchangeError.message : 'OAuth callback failed.'
    return NextResponse.redirect(
      toDashboardSocialsUrl(
        req,
        `?oauth=error&platform=${platform}&reason=${encodeURIComponent(message)}`
      )
    )
  }
}
