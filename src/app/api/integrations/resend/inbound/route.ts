import { NextRequest, NextResponse } from 'next/server'
import { resolvePluginIngressAllowed } from '@/lib/integrations/plugin-settings'

/** Resend inbound / webhook scaffold (Track 10.20). */
export async function POST(req: NextRequest) {
  if (!(await resolvePluginIngressAllowed('resend'))) {
    return NextResponse.json(
      {
        error: 'Resend plugin is disabled',
        disabled: true,
        hint: 'Set INTEGRATION_RESEND_ENABLED=1 when you want inbound email webhooks.',
      },
      { status: 404 }
    )
  }
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ received: true, keys: Object.keys(body as object) })
}
