import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.rewards')

const createRewardSchema = z.object({
  customer_id: z.string().uuid(),
  staff_id: z.string().uuid().optional().nullable(),
  category: z.string().min(1),
  description: z.string().min(1),
  value: z.number().nonnegative(),
  status: z.string().optional(),
  redemption_code: z.string().optional(),
  requires_age_verification: z.boolean().optional(),
  expires_at: z.string().optional().nullable(),
})

export const GET = withSecurity(
  async (req, { user }) => {
    try {
      const { searchParams } = new URL(req.url)
      let customer_id = searchParams.get('customer_id') || ''
      const category = searchParams.get('category') || ''
      const status = searchParams.get('status') || ''
      const requires_age_verification = searchParams.get('requires_age_verification') || ''
      const date_from = searchParams.get('date_from') || ''
      const date_to = searchParams.get('date_to') || ''
      const claimed = searchParams.get('claimed') || ''

      log.info('Rewards API: Starting GET request')

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Rewards API: Missing required environment variables')
        return NextResponse.json({ data: [] })
      }

      // Always try to use real database first
      log.info('Rewards API: Attempting to connect to Supabase database')
      const supabase = await createClient()

      // Test database connection
      const { error: testError } = await supabase.from('enhanced_rewards').select('count').limit(1)

      if (testError) {
        log.error('Rewards API: Database connection failed:', testError)
        return NextResponse.json({ data: [] })
      }

      log.info('Rewards API: Database connection successful, fetching rewards')

      if (user.role === 'customer') {
        const { data: customerRow, error: customerErr } = await supabase
          .from('customers')
          .select('id')
          .eq('profile_id', user.profileId)
          .maybeSingle()

        if (customerErr || !customerRow?.id) {
          return NextResponse.json({ data: [] })
        }

        if (customer_id && customer_id !== customerRow.id) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          )
        }

        customer_id = customerRow.id
      }

      // Build query
      let query = supabase
        .from('enhanced_rewards')
        .select(
          `
        *,
        customer:customers(id, name, email, date_of_birth),
        staff:staff(id, position)
      `
        )
        .order('created_at', { ascending: false })

      // Add filters
      if (customer_id) {
        query = query.eq('customer_id', customer_id)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (requires_age_verification !== '') {
        query = query.eq('requires_age_verification', requires_age_verification === 'true')
      }

      if (date_from) {
        query = query.gte('created_at', date_from)
      }

      if (date_to) {
        query = query.lte('created_at', date_to)
      }

      if (claimed !== '') {
        query = query.eq('claimed', claimed === 'true')
      }

      const { data: rewards, error } = await query

      if (error) {
        log.error('Rewards API: Failed to fetch rewards from database:', error)
        return NextResponse.json({ data: [] })
      }

      log.info(`Rewards API: Successfully fetched ${rewards?.length || 0} rewards from database`)

      // Transform the data to match the expected format
      const transformedRewards =
        rewards?.map((reward: Record<string, unknown>) => ({
          ...reward,
          created_at: new Date(String(reward.created_at)),
          updated_at: new Date(String(reward.updated_at)),
          expires_at: reward.expires_at ? new Date(String(reward.expires_at)) : null,
        })) || []

      log.info('Rewards API: Returning transformed rewards from database')
      return NextResponse.json({
        data: transformedRewards,
      })
    } catch (error) {
      log.error('Rewards API: Unexpected error:', error)
      return NextResponse.json({ data: [] })
    }
  },
  {
    requireAuth: true,
    requireRole: 'customer',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'reward',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createRewardSchema>
      log.info('Rewards API: POST request received:', data)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Rewards API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Rewards API: Attempting to create reward in database')
      const supabase = await createClient()

      const { data: reward, error } = await supabase
        .from('enhanced_rewards')
        .insert([data])
        .select()
        .single()

      if (error) {
        log.error('Rewards API: Failed to create reward in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Rewards API: Reward created successfully in database:', reward)
      return NextResponse.json(reward)
    } catch (error) {
      log.error('Rewards API: Error creating reward:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'strict',
    validateBody: createRewardSchema,
    auditAction: 'create',
    auditResourceType: 'reward',
  }
)
