import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getShifts } from '@/lib/schedule'
import { createShift } from '@/lib/schedule'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.schedule')

const createShiftSchema = z.object({
  staff_id: z.string().uuid(),
  shift_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export const GET = withSecurity(
  async (req) => {
    try {
      log.info('Schedule API: Starting GET request')

      // Get query parameters for filtering
      const { searchParams } = new URL(req.url)
      const staff_id = searchParams.get('staff_id')
      const shift_type = searchParams.get('shift_type')
      const date_from = searchParams.get('date_from')
      const date_to = searchParams.get('date_to')

      // Build filters object
      const filters: Record<string, string> = {}
      if (staff_id && staff_id !== 'all') filters.staff_id = staff_id
      if (shift_type && shift_type !== 'all') filters.shift_type = shift_type
      if (date_from) filters.date_from = date_from
      if (date_to) filters.date_to = date_to

      log.info('Schedule API: Fetching shifts with filters:', filters)

      // Fetch shifts from database
      const shifts = await getShifts(filters)

      return NextResponse.json({
        shifts: shifts || [], // Ensure we always return an array
      })
    } catch (error) {
      log.error('Error fetching shifts:', error)
      // Return empty shifts array instead of error to prevent page crash
      return NextResponse.json({
        shifts: [],
        error: 'Failed to fetch shifts, but page can still function',
      })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'staff',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createShiftSchema>

      const newShift = await createShift({
        ...data,
        role: data.role ?? 'staff',
      })

      return NextResponse.json(newShift, { status: 201 })
    } catch (error) {
      log.error('Unexpected error in schedule API:', error)

      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown unexpected error',
          code: 'UNEXPECTED_ERROR',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: createShiftSchema,
    auditAction: 'create',
    auditResourceType: 'staff',
  }
)
