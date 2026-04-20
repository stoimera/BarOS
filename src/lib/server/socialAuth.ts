import { SupabaseClient } from "@supabase/supabase-js";
import { createServerApiClient } from "@/utils/supabase/api";

export interface AuthenticatedAdmin {
  userId: string;
  profileId: string;
  role: string;
  supabase: SupabaseClient;
}

export type AdminAuthResult =
  | { ok: true; data: AuthenticatedAdmin }
  | { ok: false; status: number; error: string };

export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createServerApiClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, status: 404, error: "Profile not found" };
  }

  if (profile.role !== "admin") {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return {
    ok: true,
    data: {
      userId: user.id,
      profileId: profile.id as string,
      role: profile.role as string,
      supabase,
    },
  };
}

