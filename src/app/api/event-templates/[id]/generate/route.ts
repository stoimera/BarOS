import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/utils/supabase/api'
import { addWeeks, addMonths } from 'date-fns'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.event-templates.[id].generate')

const generateEventsSchema = z.object({
  numberOfEvents: z.number().int().positive().max(52),
  startDate: z.string().min(1),
})

export const POST = withSecurity(
  async (_req, { routeContext, validatedBody }) => {
    try {
      const { params } = routeContext as { params: { id: string } }
      const { id } = params
      const { numberOfEvents, startDate } = validatedBody as z.infer<typeof generateEventsSchema>

      log.info('event_templates_generate', { id, numberOfEvents, startDate })

      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log.error('Event Templates API: Missing required environment variables')
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }

      // Get the template
      const supabase = await createApiClient()

      const { data: template, error: templateError } = await supabase
        .from('event_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (templateError || !template) {
        log.error('Event Templates API: Failed to fetch template:', templateError)
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Generate events
      const events = []
      let currentDate = new Date(startDate)

      for (let i = 0; i < numberOfEvents; i++) {
        const eventData = {
          title: template.name,
          description: template.description,
          event_date: currentDate.toISOString(),
          location: '', // Not stored in template
          max_capacity: template.max_capacity,
          price: template.price,
          is_active: false,
        }

        const { data: event, error: eventError } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single()

        if (eventError) {
          log.error('Event Templates API: Failed to create event:', eventError)
          return NextResponse.json({ error: eventError.message }, { status: 500 })
        }

        events.push(event)

        // Calculate next date based on recurrence pattern
        switch (template.recurrence_pattern || 'weekly') {
          case 'weekly':
            currentDate = addWeeks(currentDate, 1)
            break
          case 'monthly':
            currentDate = addMonths(currentDate, 1)
            break
          case 'quarterly':
            currentDate = addMonths(currentDate, 3)
            break
          default:
            currentDate = addWeeks(currentDate, 1)
        }
      }

      log.info('Event Templates API: Generated events successfully:', events.length)
      return NextResponse.json({ events })
    } catch (error) {
      log.error('Event Templates API: Error generating events:', error)
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
    validateBody: generateEventsSchema,
    auditAction: 'create',
    auditResourceType: 'event',
  }
)
