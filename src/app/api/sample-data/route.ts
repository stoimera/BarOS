import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createSampleBookings } from '@/lib/sample-data'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.sample-data')

const sampleDataRequestSchema = z.object({
  seed: z.number().int().optional(),
})

export const POST = withSecurity(
  async () => {
    try {
      log.info('Sample Data API: Creating sample bookings for testing')

      const result = await createSampleBookings()

      return NextResponse.json({
        success: true,
        message: 'Sample booking data created successfully',
        data: result,
      })
    } catch (error) {
      log.error('Sample Data API: Error creating sample data:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create sample data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    validateBody: sampleDataRequestSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)

export const GET = withSecurity(
  async () =>
    NextResponse.json({
      message: 'Sample Data API - Use POST to create sample bookings',
      endpoints: {
        'POST /api/sample-data': 'Create sample booking data (admin only)',
      },
    }),
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)
