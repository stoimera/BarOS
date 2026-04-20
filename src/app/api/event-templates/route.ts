import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.event-templates')

const createEventTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  default_capacity: z.number().int().positive().optional(),
  default_price: z.number().nonnegative().optional(),
  default_duration: z.number().positive().optional(),
  recurring_options: z
    .object({
      frequency: z.string().min(1),
    })
    .optional(),
})

export const GET = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search') || ''
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')

      log.info('Event Templates API: Starting GET request')

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ data: [], count: 0 })
      }

      // Always try to use real database first
      log.info('Event Templates API: Attempting to connect to Supabase database')
      const supabase = await createApiClient()

      // Test database connection
      const { error: testError } = await supabase.from('event_templates').select('count').limit(1)

      if (testError) {
        log.error('Event Templates API: Database connection failed:', testError)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info('Event Templates API: Database connection successful, fetching templates')

      // Build query
      let query = supabase.from('event_templates').select('*', { count: 'exact' })

      // Add search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data: templates, error, count } = await query

      if (error) {
        log.error('Event Templates API: Failed to fetch templates from database:', error)
        return NextResponse.json({ data: [], count: 0 })
      }

      log.info(
        `Event Templates API: Successfully fetched ${templates?.length || 0} templates from database`
      )

      // Transform the data to match the expected format
      const transformedTemplates =
        templates?.map((template: Record<string, unknown>) => ({
          id: template.id,
          name: template.name || '',
          description: template.description || '',
          category: template.category || 'general',
          default_duration: template.duration_hours || 2,
          default_capacity: template.max_capacity || 50,
          default_price: template.price || 0,
          suggested_location: '', // Not stored in database
          recommended_marketing_channels: ['email', 'social_media'], // Default value
          checklist_items: [], // Not stored in database
          recurring_options: template.recurrence_pattern
            ? {
                frequency: template.recurrence_pattern,
                best_days: [0], // Default value
                best_times: ['19:00'], // Default value
                seasonal_factors: [], // Not stored in database
              }
            : null,
          is_active: template.is_active ?? true,
          created_by: template.created_by,
          created_at: new Date(String(template.created_at ?? new Date().toISOString())),
          updated_at: new Date(String(template.updated_at ?? new Date().toISOString())),
        })) || []

      log.info('Event Templates API: Returning transformed templates from database')
      return NextResponse.json({
        templates: transformedTemplates,
        count: count || 0,
      })
    } catch (error) {
      log.error('Event Templates API: Unexpected error:', error)
      return NextResponse.json({ data: [], count: 0 })
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'default',
    auditAction: 'view',
    auditResourceType: 'event',
  }
)

export const POST = withSecurity(
  async (_req, { validatedBody }) => {
    try {
      const data = validatedBody as z.infer<typeof createEventTemplateSchema>
      log.info('Event Templates API: POST request received:', data)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Event Templates API: Attempting to create template in database')
      const supabase = await createApiClient()

      // Map form data to database schema
      const dbData = {
        name: data.name,
        description: data.description,
        category: data.category || 'general',
        max_capacity: data.default_capacity || 50,
        price: data.default_price || 0.0,
        duration_hours: data.default_duration || 2,
        recurrence_pattern: data.recurring_options?.frequency || 'weekly',
        is_active: true,
      }

      log.info('Event Templates API: Mapped data for database:', dbData)

      const { data: template, error } = await supabase
        .from('event_templates')
        .insert([dbData])
        .select()
        .single()

      if (error) {
        log.error('Event Templates API: Failed to create template in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Event Templates API: Template created successfully in database:', template)
      return NextResponse.json({ template })
    } catch (error) {
      log.error('Event Templates API: Error creating template:', error)
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
    validateBody: createEventTemplateSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)

export const DELETE = withSecurity(
  async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
      }

      log.info('Event Templates API: DELETE request for template ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Event Templates API: Attempting to delete template from database')
      const supabase = await createApiClient()

      const { error } = await supabase.from('event_templates').delete().eq('id', id)

      if (error) {
        log.error('Event Templates API: Failed to delete template from database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      log.info('Event Templates API: Template deleted successfully from database')
      return NextResponse.json({ success: true })
    } catch (error) {
      log.error('Event Templates API: Error deleting template:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'admin',
    rateLimitType: 'strict',
    auditAction: 'delete',
    auditResourceType: 'event',
  }
)
