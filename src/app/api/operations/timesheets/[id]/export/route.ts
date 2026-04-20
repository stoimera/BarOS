import { NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { fetchStaffIdForProfile } from '@/lib/operations/staff-time'

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export const GET = withSecurity(
  async (_req, { routeContext, user }) => {
    const { params } = routeContext as { params: { id: string } }
    const supabase = await createClient()

    const { data: row, error } = await supabase.from('timesheets').select('*').eq('id', params.id).single()
    if (error || !row) return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })

    if (row.lifecycle_status !== 'locked') {
      return NextResponse.json({ error: 'Payroll export requires a locked timesheet' }, { status: 400 })
    }

    if (user.role !== 'admin') {
      const sid = await fetchStaffIdForProfile(supabase, user.profileId)
      if (!sid || sid !== row.staff_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (row.payroll_exported_at) {
      return NextResponse.json({ error: 'Payroll already exported for this period' }, { status: 409 })
    }

    const header = ['timesheet_id', 'staff_id', 'period_start', 'period_end', 'regular_hours', 'overtime_hours', 'lifecycle_status', 'exported_at']
    const now = new Date().toISOString()
    const line = [
      csvEscape(row.id),
      csvEscape(row.staff_id),
      csvEscape(row.period_start),
      csvEscape(row.period_end),
      csvEscape(row.regular_hours),
      csvEscape(row.overtime_hours),
      csvEscape(row.lifecycle_status),
      csvEscape(now),
    ]

    const { error: upErr } = await supabase
      .from('timesheets')
      .update({ payroll_exported_at: now, export_status: 'exported' })
      .eq('id', params.id)
      .select()
      .single()

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const body = `${header.join(',')}\n${line.join(',')}\n`
    return new NextResponse(body, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="timesheet-${String(row.id).slice(0, 8)}.csv"`,
      },
    })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'staff_time.read',
    rateLimitType: 'strict',
    auditAction: 'export',
    auditResourceType: 'staff',
  }
)
