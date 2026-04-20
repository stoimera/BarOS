import { SupabaseClient } from "@supabase/supabase-js";
import { SocialPlatform, SocialPlatformCredentials } from "@/lib/socialPublishing";

type IntegrationRow = {
  id: string;
  name: string;
  config: Record<string, unknown> | null;
  is_active: boolean;
  updated_at: string;
};

export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  connected: boolean;
  updatedAt: string;
  config: SocialPlatformCredentials;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "tiktok"];

function integrationName(platform: SocialPlatform): string {
  return `social-${platform}`;
}

function toCredentials(config: Record<string, unknown> | null): SocialPlatformCredentials {
  const cfg = config ?? {};
  return {
    accessToken: typeof cfg.accessToken === "string" ? cfg.accessToken : undefined,
    pageId: typeof cfg.pageId === "string" ? cfg.pageId : undefined,
    accountId: typeof cfg.accountId === "string" ? cfg.accountId : undefined,
    webhookUrl: typeof cfg.webhookUrl === "string" ? cfg.webhookUrl : undefined,
  };
}

export async function listSocialConnections(
  supabase: SupabaseClient
): Promise<SocialConnection[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, name, config, is_active, updated_at")
    .eq("integration_type", "social")
    .in("name", SOCIAL_PLATFORMS.map(integrationName));

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as IntegrationRow[];
  const map = new Map(rows.map((row) => [row.name, row]));

  return SOCIAL_PLATFORMS.map((platform) => {
    const row = map.get(integrationName(platform));
    return {
      id: row?.id ?? "",
      platform,
      connected: Boolean(row?.is_active),
      updatedAt: row?.updated_at ?? "",
      config: toCredentials(row?.config ?? null),
    };
  });
}

export async function upsertSocialConnection(
  supabase: SupabaseClient,
  platform: SocialPlatform,
  config: SocialPlatformCredentials
): Promise<void> {
  const now = new Date().toISOString();
  const name = integrationName(platform);
  const payload = {
    name,
    integration_type: "social",
    config,
    is_active: true,
    updated_at: now,
    last_sync_at: now,
  };

  const { data: existing, error: existingError } = await supabase
    .from("integrations")
    .select("id")
    .eq("name", name)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("integrations")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await supabase.from("integrations").insert(payload);
  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function disconnectSocialConnection(
  supabase: SupabaseClient,
  platform: SocialPlatform
): Promise<void> {
  const { error } = await supabase
    .from("integrations")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("name", integrationName(platform));

  if (error) {
    throw new Error(error.message);
  }
}

export async function getActiveConnectionMap(
  supabase: SupabaseClient
): Promise<Map<SocialPlatform, SocialPlatformCredentials>> {
  const list = await listSocialConnections(supabase);
  return new Map(
    list
      .filter((item) => item.connected)
      .map((item) => [item.platform, item.config] as const)
  );
}

