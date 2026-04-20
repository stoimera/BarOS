import { NextRequest, NextResponse } from 'next/server'
import { resolvePluginIngressAllowed } from '@/lib/integrations/plugin-settings'

/**
 * Stripe webhook ingress (Track 10.18 scaffold).
 * Verify `Stripe-Signature` with STRIPE_WEBHOOK_SECRET before trusting payloads in production.
 */
export async function POST(req: NextRequest) {
  if (!(await resolvePluginIngressAllowed('stripe'))) {
    return NextResponse.json(
      {
        error: 'Stripe plugin is disabled',
        disabled: true,
        hint: 'Set INTEGRATION_STRIPE_ENABLED=1 and configure Stripe env vars when you are ready.',
      },
      { status: 404 }
    )
  }
  const raw = await req.text()
  return NextResponse.json({
    received: true,
    bytes: raw.length,
    hint: 'Wire signature verification and idempotent event handling before production.',
  })
}
