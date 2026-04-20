import { createServiceRoleClient } from '@/utils/supabase/service-role'

export type IdempotentResult = { replayed: boolean; body: unknown; status: number }

/**
 * Dedupe mutating handlers by `Idempotency-Key` header scope (e.g. `payments:create`).
 * Stored responses are returned on replay (Track 3.7).
 */
export async function getOrExecuteIdempotent(
  scope: string,
  idempotencyKey: string | null | undefined,
  execute: () => Promise<{ status: number; body: unknown }>
): Promise<IdempotentResult> {
  if (!idempotencyKey || idempotencyKey.length < 8) {
    const fresh = await execute()
    return { replayed: false, body: fresh.body, status: fresh.status }
  }

  const supabase = await createServiceRoleClient()
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('response_status, response_body')
    .eq('scope', scope)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existing?.response_body != null) {
    return {
      replayed: true,
      status: Number(existing.response_status),
      body: existing.response_body,
    }
  }

  const fresh = await execute()
  if (fresh.status >= 400) {
    return { replayed: false, body: fresh.body, status: fresh.status }
  }

  const { error } = await supabase.from('idempotency_keys').insert({
    scope,
    idempotency_key: idempotencyKey,
    response_status: fresh.status,
    response_body: fresh.body as object,
  })

  if (error) {
    if (error.code === '23505') {
      const { data: row } = await supabase
        .from('idempotency_keys')
        .select('response_status, response_body')
        .eq('scope', scope)
        .eq('idempotency_key', idempotencyKey)
        .single()
      if (row?.response_body != null) {
        return {
          replayed: true,
          status: Number(row.response_status),
          body: row.response_body,
        }
      }
    }
    throw error
  }

  return { replayed: false, body: fresh.body, status: fresh.status }
}
