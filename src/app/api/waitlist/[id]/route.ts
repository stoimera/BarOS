import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.waitlist.[id]')

const waitlistUpdateSchema = z.object({
  customer_name: z.string().min(1).optional(),
  customer_email: z.string().email().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  date: z.string().optional(),
  time: z.string().optional(),
  party_size: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'vip']).optional(),
  priority_rank: z.number().int().min(0).max(100000).optional(),
  status: z.string().optional(),
})

export const PUT = withSecurity(
  async (_request, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }

      const body = validatedBody as z.infer<typeof waitlistUpdateSchema>
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('waitlist')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ waitlist_entry: data })
    } catch (error) {
      log.error('Waitlist PUT error:', error)
      return NextResponse.json({ error: 'Failed to update waitlist entry' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: waitlistUpdateSchema,
    auditAction: 'update',
    auditResourceType: 'booking',
  }
)

export const DELETE = withSecurity(
  async (_request, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }

      const supabase = await createClient()

      const { error } = await supabase.from('waitlist').delete().eq('id', params.id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Waitlist DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete waitlist entry' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'booking',
  }
)
