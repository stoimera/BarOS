import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { fetchOpenAttendanceLog, fetchStaffIdForProfile } from '@/lib/operations/staff-time'

const clockInSchema = z.object({
  staff_id: z.string().uuid().optional(),
})

export const GET = withSecurity(
  async (req, { user }) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const anomaliesOnly = searchParams.get('anomalies_only') === '1'
    const staffScope = searchParams.get('staff_id')?.trim()

    let query = supabase
      .from('attendance_logs')
      .select('*, staff(id, position, profile_id)')
      .order('clock_in', { ascending: false })

    if (user.role !== 'admin') {
      const sid = await fetchStaffIdForProfile(supabase, user.profileId)
      if (!sid) return NextResponse.json({ error: 'No staff record for this profile' }, { status: 403 })
      query = query.eq('staff_id', sid)
    } else if (staffScope && /^[0-9a-f-]{36}$/i.test(staffScope)) {
      query = query.eq('staff_id', staffScope)
    }

    if (anomaliesOnly) {
      query = query.eq('anomaly_flag', true)
    }

    const { data, error } = await query.limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'staff_time.read',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'staff',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody, user }) => {
    const body = validatedBody as z.infer<typeof clockInSchema>
    const supabase = await createClient()

    let staffId: string | null = null
    if (user.role === 'admin' && body.staff_id) {
      staffId = body.staff_id
    } else {
      staffId = await fetchStaffIdForProfile(supabase, user.profileId)
    }
    if (!staffId) return NextResponse.json({ error: 'Unable to resolve staff for clock-in' }, { status: 403 })

    const open = await fetchOpenAttendanceLog(supabase, staffId)
    if (open) {
      return NextResponse.json({ error: 'Already clocked in; clock out before a new shift' }, { status: 400 })
    }

    const clockIn = new Date().toISOString()
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([{ staff_id: staffId, clock_in: clockIn, anomaly_flag: false }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'staff_time.write',
    rateLimitType: 'strict',
    validateBody: clockInSchema,
    auditAction: 'create',
    auditResourceType: 'staff',
  }
)
