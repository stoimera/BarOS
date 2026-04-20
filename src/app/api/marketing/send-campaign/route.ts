import { NextResponse } from 'next/server'
import { sendBulkMarketingCampaign } from '@/lib/email'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const sendCampaignSchema = z.object({
  customers: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email(),
      })
    )
    .min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  businessName: z.string().optional(),
})

export const POST = withSecurity(
  async (req, { validatedBody }) => {
    try {
      const { customers, subject, message, businessName } = validatedBody as z.infer<
        typeof sendCampaignSchema
      >

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        return NextResponse.json({ error: 'No customers provided' }, { status: 400 })
      }

      if (!subject || !message) {
        return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
      }

      const result = await sendBulkMarketingCampaign(
        customers,
        subject,
        message,
        businessName || 'Your Bar'
      )

      return NextResponse.json(result)
    } catch (error) {
      let message = 'Failed to send campaign'
      if (error instanceof Error) message = error.message
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: sendCampaignSchema,
    auditAction: 'create',
    auditResourceType: 'campaign',
  }
)
