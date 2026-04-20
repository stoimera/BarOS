import { NextRequest, NextResponse } from 'next/server'
import { createServerApiClient } from '@/utils/supabase/api'
import { requireAdmin } from '@/lib/server/socialAuth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitRaw = Number(searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20
    const mode = searchParams.get('mode')
    const month = searchParams.get('month')

    const supabase = await createServerApiClient()

    if (mode === 'scheduled') {
      const auth = await requireAdmin()
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status })
      }

      let query = auth.data.supabase
        .from('social_posts')
        .select('id, platform, content, media_urls, scheduled_at, status')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(limit)

      if (month) {
        const start = new Date(`${month}-01T00:00:00.000Z`)
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start)
          end.setUTCMonth(end.getUTCMonth() + 1)
          query = query
            .gte('scheduled_at', start.toISOString())
            .lt('scheduled_at', end.toISOString())
        }
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ posts: data ?? [] })
    }

    const { data, error } = await supabase
      .from('social_posts')
      .select('id, platform, content, media_urls, posted_at, status')
      .eq('status', 'posted')
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data ?? [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load posts' },
      { status: 500 }
    )
  }
}
