import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { isPluginSwitchedOn, type IntegrationPluginId } from '@/lib/integrations/plugins'

const TABLE = 'integration_plugin_settings'

export type PluginDbRow = { plugin_id: IntegrationPluginId; enabled: boolean }

/**
 * Staff-scoped read (RLS) for dashboard status.
 */
export async function fetchPluginSettingsRowsClient(supabase: SupabaseClient): Promise<PluginDbRow[]> {
  const { data, error } = await supabase.from(TABLE).select('plugin_id, enabled')
  if (error || !data) return []
  return data as PluginDbRow[]
}

/**
 * Webhooks run without a user session; read toggles with the service role.
 * If a row exists for `plugin_id`, its `enabled` value is authoritative.
 * If no row exists, fall back to env `INTEGRATION_*_ENABLED` (see `plugins.ts`).
 */
export async function resolvePluginIngressAllowed(id: IntegrationPluginId): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase.from(TABLE).select('enabled').eq('plugin_id', id).maybeSingle()
  if (error) {
    return isPluginSwitchedOn(id)
  }
  if (data && typeof data.enabled === 'boolean') {
    return data.enabled
  }
  return isPluginSwitchedOn(id)
}
