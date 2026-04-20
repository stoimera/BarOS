/**
 * Stub database types for CI schema-drift enforcement (Track 2.17 / 0.4.7).
 * Replace with `supabase gen types typescript --linked` output when you want strict drift checks.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
