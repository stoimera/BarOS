import { NextRequest, NextResponse } from 'next/server'
import { resolvePluginIngressAllowed } from '@/lib/integrations/plugin-settings'

/** Google OAuth / Places reviews callback scaffold (Track 10.21). */
export async function GET(req: NextRequest) {
  if (!(await resolvePluginIngressAllowed('google_reviews'))) {
    return NextResponse.json(
      {
        error: 'Google reviews plugin is disabled',
        disabled: true,
        hint: 'Set INTEGRATION_GOOGLE_REVIEWS_ENABLED=1 when you want this OAuth callback.',
      },
      { status: 404 }
    )
  }
  const code = req.nextUrl.searchParams.get('code')
  return NextResponse.json({ received: true, hasCode: Boolean(code) })
}
