import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.waitlist')

const waitlistCreateSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  party_size: z.number().int().positive().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'vip']).optional(),
  priority_rank: z.number().int().min(0).max(100000).optional(),
})

export const GET = withSecurity(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const date = searchParams.get('date')
      const status = searchParams.get('status')

      const supabase = await createClient()

      let query = supabase
        .from('waitlist')
        .select('*')
        .order('priority_rank', { ascending: true })
        .order('created_at', { ascending: true })

      if (date) {
        query = query.eq('date', date)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return NextResponse.json({ waitlist: data || [] })
    } catch (error) {
      log.error('Waitlist GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch waitlist entries' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'booking',
  }
)

export const POST = withSecurity(
  async (_request, { user, validatedBody }) => {
    try {
      const body = validatedBody as z.infer<typeof waitlistCreateSchema>
      const {
        customer_name,
        customer_email,
        customer_phone,
        date,
        time,
        party_size,
        notes,
        priority = 'medium',
        priority_rank,
      } = body

      if (!customer_name || !date || !time) {
        return NextResponse.json(
          { error: 'Customer name, date, and time are required' },
          { status: 400 }
        )
      }

      const supabase = await createClient()

      const { data, error } = await supabase
        .from('waitlist')
        .insert([
          {
            customer_name,
            customer_email,
            customer_phone,
            date,
            time,
            party_size: party_size || 1,
            notes,
            priority,
            priority_rank: priority_rank ?? 100,
            status: 'waiting',
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ waitlist_entry: data })
    } catch (error) {
      log.error('Waitlist POST error:', error)
      return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: waitlistCreateSchema,
    auditAction: 'create',
    auditResourceType: 'booking',
  }
)
