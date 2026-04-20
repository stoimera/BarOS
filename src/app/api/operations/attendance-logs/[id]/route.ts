import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { auditLog } from '@/lib/security/audit'
import { createClient } from '@/utils/supabase/server'
import {
  evaluateAttendanceAnomaly,
  fetchActiveBreak,
  fetchStaffIdForProfile,
} from '@/lib/operations/staff-time'

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('clock_out') }),
  z.object({ action: z.literal('start_break'), break_type: z.enum(['rest', 'meal']).optional() }),
  z.object({ action: z.literal('end_break') }),
  z.object({ action: z.literal('clear_anomaly'), reason: z.string().min(3) }),
])

export const PATCH = withSecurity(
  async (req, { routeContext, validatedBody, user }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof patchSchema>
    const supabase = await createClient()

    const { data: log, error: loadErr } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('id', params.id)
      .single()
    if (loadErr || !log) return NextResponse.json({ error: 'Attendance log not found' }, { status: 404 })

    if (user.role !== 'admin') {
      const sid = await fetchStaffIdForProfile(supabase, user.profileId)
      if (!sid || sid !== log.staff_id) {
        return NextResponse.json({ error: 'You can only update your own attendance' }, { status: 403 })
      }
    }

    if (body.action === 'clear_anomaly') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can clear anomalies' }, { status: 403 })
      }
      const { data, error } = await supabase
        .from('attendance_logs')
        .update({ anomaly_flag: false, anomaly_reason: null })
        .eq('id', params.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      await auditLog(
        {
          user_id: user.profileId,
          action: 'update',
          resource_type: 'staff',
          resource_id: params.id,
          metadata: { operation: 'clear_attendance_anomaly', reason: body.reason },
        },
        req
      )
      return NextResponse.json({ data })
    }

    if (body.action === 'clock_out') {
      if (log.clock_out) {
        return NextResponse.json({ error: 'Already clocked out' }, { status: 400 })
      }
      const activeBreak = await fetchActiveBreak(supabase, params.id)
      if (activeBreak) {
        return NextResponse.json({ error: 'End active break before clock-out' }, { status: 400 })
      }
      const clockOut = new Date().toISOString()
      const { flag, reason } = evaluateAttendanceAnomaly(log.clock_in as string, clockOut)
      const { data, error } = await supabase
        .from('attendance_logs')
        .update({
          clock_out: clockOut,
          anomaly_flag: flag,
          anomaly_reason: reason,
        })
        .eq('id', params.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    if (log.clock_out) {
      return NextResponse.json({ error: 'Shift is closed' }, { status: 400 })
    }

    if (body.action === 'start_break') {
      const active = await fetchActiveBreak(supabase, params.id)
      if (active) return NextResponse.json({ error: 'A break is already in progress' }, { status: 400 })
      const { data, error } = await supabase
        .from('staff_break_logs')
        .insert([
          {
            attendance_log_id: params.id,
            break_type: body.break_type ?? 'rest',
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    // end_break
    const active = await fetchActiveBreak(supabase, params.id)
    if (!active) return NextResponse.json({ error: 'No active break to end' }, { status: 400 })
    const { data, error } = await supabase
      .from('staff_break_logs')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', active.id)
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
    validateBody: patchSchema,
    auditAction: 'update',
    auditResourceType: 'staff',
  }
)
