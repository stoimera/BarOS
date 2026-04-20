import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { processDailyReminders } from '@/lib/reminders'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.reminders.process')

const processRemindersSchema = z.object({
  force: z.boolean().optional(),
})

export const POST = withSecurity(
  async () => {
    try {
      // Process daily reminders
      await processDailyReminders()

      return NextResponse.json({
        success: true,
        message: 'Daily reminders processed successfully',
      })
    } catch (error) {
      log.error('Error processing daily reminders:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process daily reminders',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: processRemindersSchema,
    auditAction: 'update',
    auditResourceType: 'task',
  }
)

export const GET = withSecurity(
  async () =>
    NextResponse.json({
      message: 'Reminder processing endpoint. Use POST to process reminders.',
    }),
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'task',
  }
)
