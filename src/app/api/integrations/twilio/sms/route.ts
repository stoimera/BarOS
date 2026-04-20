import { NextRequest, NextResponse } from 'next/server'
import { resolvePluginIngressAllowed } from '@/lib/integrations/plugin-settings'

/** Twilio SMS status / inbound scaffold (Track 10.19). */
export async function POST(req: NextRequest) {
  if (!(await resolvePluginIngressAllowed('twilio'))) {
    return NextResponse.json(
      {
        error: 'Twilio plugin is disabled',
        disabled: true,
        hint: 'Set INTEGRATION_TWILIO_ENABLED=1 when you want SMS ingress.',
      },
      { status: 404 }
    )
  }
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({ received: true, keys: Object.keys(body as object) })
}
