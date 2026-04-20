import type { SupabaseClient } from '@supabase/supabase-js'

function asDbError(err: { message?: unknown; code?: string }): Error {
  const msg =
    typeof err.message === 'string'
      ? err.message
      : err.message != null
        ? JSON.stringify(err.message)
        : 'Database request failed'
  return new Error(err.code ? `${err.code}: ${msg}` : msg)
}

export async function fetchStaffIdForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase.from('staff').select('id').eq('profile_id', profileId).limit(1)
  if (error) throw asDbError(error)
  const row = Array.isArray(data) ? data[0] : data
  const id = row && typeof row === 'object' && 'id' in row ? (row as { id: unknown }).id : undefined
  return typeof id === 'string' ? id : null
}

export async function fetchOpenAttendanceLog(
  supabase: SupabaseClient,
  staffId: string
): Promise<{ id: string; clock_in: string; clock_out: string | null } | null> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('id, clock_in, clock_out')
    .eq('staff_id', staffId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
  if (error) throw asDbError(error)
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object' || !('id' in row) || !('clock_in' in row)) return null
  const rec = row as { id: unknown; clock_in: unknown; clock_out: unknown }
  if (typeof rec.id !== 'string' || typeof rec.clock_in !== 'string') return null
  return {
    id: rec.id,
    clock_in: rec.clock_in,
    clock_out: (rec.clock_out as string | null) ?? null,
  }
}

/** True if shift length is implausible (Track 7.4). */
export function evaluateAttendanceAnomaly(clockInIso: string, clockOutIso: string): { flag: boolean; reason: string | null } {
  const inT = new Date(clockInIso).getTime()
  const outT = new Date(clockOutIso).getTime()
  if (!Number.isFinite(inT) || !Number.isFinite(outT) || outT < inT) {
    return { flag: true, reason: 'invalid_clock_range' }
  }
  const hours = (outT - inT) / (1000 * 60 * 60)
  if (hours > 16) return { flag: true, reason: 'shift_over_16h' }
  if (hours < 1 / 60) return { flag: true, reason: 'shift_under_one_minute' }
  return { flag: false, reason: null }
}

export async function fetchActiveBreak(
  supabase: SupabaseClient,
  attendanceLogId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('staff_break_logs')
    .select('id')
    .eq('attendance_log_id', attendanceLogId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw asDbError(error)
  return data?.id ? { id: data.id as string } : null
}
