import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/utils/error-handling'
import { getShiftById, updateShift, deleteShift } from '@/lib/schedule'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.schedule.[id]')

const updateShiftSchema = z.object({
  staff_id: z.string().uuid(),
  shift_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export const PUT = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      log.info('Schedule API [id]: Starting PUT request')
      const { id } = await params

      const data = validatedBody as z.infer<typeof updateShiftSchema>

      // Check if shift exists
      const existingShift = await getShiftById(id)
      if (!existingShift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
      }

      // Update shift in database - use correct field names from UpdateShiftData type
      const updatedShift = await updateShift(id, {
        staff_id: data.staff_id,
        shift_date: data.shift_date,
        start_time: data.start_time,
        end_time: data.end_time,
        role: data.role,
        notes: data.notes,
      })

      return NextResponse.json({ shift: updatedShift })
    } catch (error) {
      log.error('Error updating shift:', error)
      const { error: message, status } = handleApiError(error)
      return NextResponse.json({ error: message }, { status })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: updateShiftSchema,
    auditAction: 'update',
    auditResourceType: 'staff',
  }
)

export const DELETE = withSecurity(
  async (_req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: Promise<{ id: string }> }
      log.info('Schedule API [id]: Starting DELETE request')
      const { id } = await params

      // Check if shift exists
      const existingShift = await getShiftById(id)
      if (!existingShift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
      }

      // Delete shift from database
      await deleteShift(id)

      return NextResponse.json({ message: 'Shift deleted successfully' })
    } catch (error) {
      log.error('Error deleting shift:', error)
      const { error: message, status } = handleApiError(error)
      return NextResponse.json({ error: message }, { status })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'staff',
  }
)
