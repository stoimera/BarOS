import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.event-templates.[id]')

const updateEventTemplateSchema = z.object({
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
  is_active: z.boolean().optional(),
})

export const GET = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      log.info('Event Templates API: GET request for template ID:', id)

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Event Templates API: Attempting to connect to Supabase database')
      const supabase = await createApiClient()

      const { data: template, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        log.error('Event Templates API: Failed to fetch template from database:', error)
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Transform database data to frontend format
      const convertedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        default_duration: template.duration_hours,
        default_capacity: template.max_capacity,
        default_price: template.price,
        suggested_location: '', // Not stored in database
        recommended_marketing_channels: ['email', 'social_media'], // Default value
        checklist_items: [], // Not stored in database
        recurring_options: {
          frequency: template.recurrence_pattern || 'weekly',
          best_days: [0], // Default value
          best_times: ['19:00'], // Default value
          seasonal_factors: [], // Not stored in database
        },
        is_active: template.is_active,
        created_by: template.created_by,
        created_at: new Date(template.created_at),
        updated_at: new Date(template.updated_at),
      }

      log.info('Event Templates API: Template fetched successfully from database')
      return NextResponse.json(convertedTemplate)
    } catch (error) {
      log.error('Event Templates API: Error fetching template:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
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

export const PUT = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      const data = validatedBody as z.infer<typeof updateEventTemplateSchema>
      log.info('event_templates_put', { id })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Always try to use real database first
      log.info('Event Templates API: Attempting to update template in database')
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
        is_active: data.is_active !== undefined ? data.is_active : true,
      }

      log.info('Event Templates API: Mapped update data for database:', dbData)

      const { data: template, error } = await supabase
        .from('event_templates')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        log.error('Event Templates API: Failed to update template in database:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Transform database data to frontend format
      const convertedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        default_duration: template.duration_hours,
        default_capacity: template.max_capacity,
        default_price: template.price,
        suggested_location: '', // Not stored in database
        recommended_marketing_channels: ['email', 'social_media'], // Default value
        checklist_items: [], // Not stored in database
        recurring_options: {
          frequency: template.recurrence_pattern || 'weekly',
          best_days: [0], // Default value
          best_times: ['19:00'], // Default value
          seasonal_factors: [], // Not stored in database
        },
        is_active: template.is_active,
        created_by: template.created_by,
        created_at: new Date(template.created_at),
        updated_at: new Date(template.updated_at),
      }

      log.info('Event Templates API: Template updated successfully in database')
      return NextResponse.json(convertedTemplate)
    } catch (error) {
      log.error('Event Templates API: Error updating template:', error)
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
    validateBody: updateEventTemplateSchema,
    auditAction: 'update',
    auditResourceType: 'event',
  }
)

export const DELETE = withSecurity(
  async (req, { routeContext }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
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
