import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withSecurity } from '@/lib/security/api-middleware'
import { auditLog } from '@/lib/security/audit'
import { createClient } from '@/utils/supabase/server'
import { fetchStaffIdForProfile } from '@/lib/operations/staff-time'
import { nextTimesheetStatus, type TimesheetLifecycleStatus } from '@/lib/operations/timesheet-lifecycle'

const transitionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('lock') }),
  z.object({ action: z.literal('reopen') }),
])

export const PATCH = withSecurity(
  async (req, { routeContext, validatedBody, user }) => {
    const { params } = routeContext as { params: { id: string } }
    const body = validatedBody as z.infer<typeof transitionSchema>
    const supabase = await createClient()

    const { data: row, error: loadErr } = await supabase.from('timesheets').select('*').eq('id', params.id).single()
    if (loadErr || !row) return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })

    if (user.role !== 'admin') {
      const sid = await fetchStaffIdForProfile(supabase, user.profileId)
      if (!sid || sid !== row.staff_id) {
        return NextResponse.json({ error: 'You can only update your own timesheets' }, { status: 403 })
      }
      if (body.action !== 'submit') {
        return NextResponse.json({ error: 'Only submit is allowed for staff' }, { status: 403 })
      }
    }

    const current = (row.lifecycle_status as TimesheetLifecycleStatus) || 'draft'
    const next = nextTimesheetStatus(current, body.action)
    if (!next) {
      return NextResponse.json({ error: `Invalid transition ${body.action} from ${current}` }, { status: 400 })
    }

    const patch: Record<string, unknown> = { lifecycle_status: next }
    const now = new Date().toISOString()
    if (body.action === 'submit') {
      patch.submitted_at = now
    }
    if (body.action === 'approve') {
      patch.approved_at = now
      patch.approved_by = user.profileId
    }
    if (body.action === 'lock') {
      patch.locked_at = now
    }
    if (body.action === 'reopen') {
      patch.submitted_at = null
      patch.approved_at = null
      patch.approved_by = null
    }

    const { data, error } = await supabase.from('timesheets').update(patch).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await auditLog(
      {
        user_id: user.profileId,
        action: 'update',
        resource_type: 'staff',
        resource_id: params.id,
        metadata: { operation: 'timesheet_lifecycle', action: body.action, from: current, to: next },
      },
      req
    )

    return NextResponse.json({ data })
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    requirePermission: 'staff_time.write',
    rateLimitType: 'strict',
    validateBody: transitionSchema,
    auditAction: 'update',
    auditResourceType: 'staff',
  }
)
