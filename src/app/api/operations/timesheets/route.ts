import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { createClient } from '@/utils/supabase/server'
import { fetchStaffIdForProfile } from '@/lib/operations/staff-time'

const createTimesheetSchema = z.object({
  period_start: z.string().min(8),
  period_end: z.string().min(8),
  regular_hours: z.number().nonnegative().optional(),
  overtime_hours: z.number().nonnegative().optional(),
  staff_id: z.string().uuid().optional(),
})

export const GET = withSecurity(
  async (req, { user }) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const staffScope = searchParams.get('staff_id')?.trim()

    let query = supabase
      .from('timesheets')
      .select('*, staff(id, position, profile_id)')
      .order('period_start', { ascending: false })

    if (user.role !== 'admin') {
      const sid = await fetchStaffIdForProfile(supabase, user.profileId)
      if (!sid) return NextResponse.json({ error: 'No staff record for this profile' }, { status: 403 })
      query = query.eq('staff_id', sid)
    } else if (staffScope && /^[0-9a-f-]{36}$/i.test(staffScope)) {
      query = query.eq('staff_id', staffScope)
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
    const body = validatedBody as z.infer<typeof createTimesheetSchema>
    const supabase = await createClient()

    let staffId: string | null = null
    if (user.role === 'admin' && body.staff_id) {
      staffId = body.staff_id
    } else {
      staffId = await fetchStaffIdForProfile(supabase, user.profileId)
    }
    if (!staffId) return NextResponse.json({ error: 'Unable to resolve staff for timesheet' }, { status: 403 })

    const ps = new Date(body.period_start)
    const pe = new Date(body.period_end)
    if (!Number.isFinite(ps.getTime()) || !Number.isFinite(pe.getTime()) || pe < ps) {
      return NextResponse.json({ error: 'Invalid period range' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('timesheets')
      .insert([
        {
          staff_id: staffId,
          period_start: body.period_start.slice(0, 10),
          period_end: body.period_end.slice(0, 10),
          regular_hours: body.regular_hours ?? 0,
          overtime_hours: body.overtime_hours ?? 0,
          lifecycle_status: 'draft',
          export_status: 'pending',
        },
      ])
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
    validateBody: createTimesheetSchema,
    auditAction: 'create',
    auditResourceType: 'staff',
  }
)
