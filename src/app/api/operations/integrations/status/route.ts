import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { isPluginSwitchedOn, pluginEnvKey, type IntegrationPluginId } from '@/lib/integrations/plugins'
import { fetchPluginSettingsRowsClient } from '@/lib/integrations/plugin-settings'

function pluginBlock(
  id: IntegrationPluginId,
  credentials: Record<string, boolean>,
  dbMap: Partial<Record<IntegrationPluginId, boolean>>
) {
  const envOn = isPluginSwitchedOn(id)
  const hasDb = Object.prototype.hasOwnProperty.call(dbMap, id)
  const dbOn = hasDb ? Boolean(dbMap[id]) : null
  const ingress = hasDb ? Boolean(dbMap[id]) : envOn
  const credsOk = Object.values(credentials).every(Boolean)
  return {
    optional: true as const,
    env_enabled: envOn,
    ui_saved: hasDb,
    ui_enabled: dbOn,
    ingress_enabled: ingress,
    env_flag: pluginEnvKey(id),
    credentials,
    ready: ingress && credsOk,
  }
}

export const GET = withSecurity(
  async () => {
    const supabase = await createClient()
    const rows = await fetchPluginSettingsRowsClient(supabase)
    const dbMap = rows.reduce<Partial<Record<IntegrationPluginId, boolean>>>((acc, r) => {
      acc[r.plugin_id] = r.enabled
      return acc
    }, {})

    return NextResponse.json({
      data: {
        note:
          'Admins can turn each connection on or off below. If you have never saved a switch here, the venue follows the default from server configuration.',
        stripe: pluginBlock('stripe', {
          publishable_key_set: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
          secret_key_set: Boolean(process.env.STRIPE_SECRET_KEY),
          webhook_secret_set: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        }, dbMap),
        twilio: pluginBlock(
          'twilio',
          {
            account_sid_set: Boolean(process.env.TWILIO_ACCOUNT_SID),
            auth_token_set: Boolean(process.env.TWILIO_AUTH_TOKEN),
            from_number_set: Boolean(process.env.TWILIO_FROM_NUMBER),
          },
          dbMap
        ),
        resend: pluginBlock('resend', { api_key_set: Boolean(process.env.RESEND_API_KEY) }, dbMap),
        google_reviews: pluginBlock(
          'google_reviews',
          { places_api_key_set: Boolean(process.env.GOOGLE_PLACES_API_KEY) },
          dbMap
        ),
      },
    })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'orders.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'organization',
  }
)
