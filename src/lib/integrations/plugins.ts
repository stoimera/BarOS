/**
 * Optional integration plugins (Stripe, Twilio, etc.).
 *
 * - Env fallback: set `INTEGRATION_<NAME>_ENABLED=1` (or `true`) when no DB row exists (see `integration_plugin_settings` + `/operations/integrations`).
 * - When a DB row exists for a plugin, its `enabled` column wins over env for ingress (see `plugin-settings.ts`).
 * - Webhook/callback routes stay inert (404) when ingress is off.
 */

export type IntegrationPluginId = 'stripe' | 'twilio' | 'resend' | 'google_reviews'

function envSwitchOn(raw: string | undefined): boolean {
  if (raw === undefined || raw === '') return false
  const v = raw.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

const PLUGIN_ENV_KEYS: Record<IntegrationPluginId, { enable: string }> = {
  stripe: { enable: 'INTEGRATION_STRIPE_ENABLED' },
  twilio: { enable: 'INTEGRATION_TWILIO_ENABLED' },
  resend: { enable: 'INTEGRATION_RESEND_ENABLED' },
  google_reviews: { enable: 'INTEGRATION_GOOGLE_REVIEWS_ENABLED' },
}

export function isPluginSwitchedOn(id: IntegrationPluginId): boolean {
  return envSwitchOn(process.env[PLUGIN_ENV_KEYS[id].enable])
}

/** True when the plugin is switched on and the HTTP ingress for that provider may run. */
export function isPluginIngressAllowed(id: IntegrationPluginId): boolean {
  return isPluginSwitchedOn(id)
}

export function pluginEnvKey(id: IntegrationPluginId): string {
  return PLUGIN_ENV_KEYS[id].enable
}
