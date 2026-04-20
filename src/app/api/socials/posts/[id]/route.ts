import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server/socialAuth'

interface UpdateScheduledBody {
  scheduledAt?: string
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const body = (await req.json()) as UpdateScheduledBody
    const scheduledAt = body.scheduledAt?.trim()

    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required.' }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt value.' }, { status: 400 })
    }

    const { data, error } = await auth.data.supabase
      .from('social_posts')
      .update({
        scheduled_at: scheduledDate.toISOString(),
        status: 'scheduled',
        posted_at: null,
        error_message: null,
      })
      .eq('id', id)
      .select('id, platform, scheduled_at, status')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update scheduled post.' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params

    const { error } = await auth.data.supabase
      .from('social_posts')
      .delete()
      .eq('id', id)
      .eq('status', 'scheduled')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scheduled post.' },
      { status: 500 }
    )
  }
}
