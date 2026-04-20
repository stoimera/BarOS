import { supabase } from './supabase'
import { EventTemplate, CreateEventTemplateData, UpdateEventTemplateData, Event } from '@/types/event'
import { addWeeks, addMonths, addDays } from 'date-fns'
import { api } from '@/lib/api/client'

export async function fetchEventTemplates(): Promise<EventTemplate[]> {
  try {
    const { data } = await api.get<{ data: EventTemplate[] }>('/api/event-templates')
    return data.data || []
  } catch (error) {
    console.error('Failed to fetch event templates:', error)
    return []
  }
}

export async function fetchEventTemplateById(id: string): Promise<EventTemplate> {
  try {
    const { data } = await api.get<EventTemplate>(`/api/event-templates/${id}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch event template:', error);
    throw error;
  }
}

export async function createEventTemplate(templateData: CreateEventTemplateData): Promise<EventTemplate> {
  try {
    const { data } = await api.post<EventTemplate>('/api/event-templates', templateData)
    return data
  } catch (error) {
    console.error('Failed to create event template:', error)
    throw error
  }
}

export async function updateEventTemplate(id: string, templateData: UpdateEventTemplateData): Promise<EventTemplate> {
  try {
    const { data } = await api.put<EventTemplate>(`/api/event-templates/${id}`, templateData);
    return data;
  } catch (error) {
    console.error('Failed to update event template:', error);
    throw error;
  }
}

export async function deleteEventTemplate(id: string): Promise<void> {
  try {
    await api.delete(`/api/event-templates/${id}`)
  } catch (error) {
    console.error('Failed to delete event template:', error)
    throw error
  }
}

export async function generateEventsFromTemplate(
  templateId: string, 
  startDate: Date, 
  numberOfEvents: number
): Promise<Event[]> {
  // Fetch the template
  const template = await fetchEventTemplateById(templateId)
  
  const events: Event[] = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < numberOfEvents; i++) {
    const eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'> = {
      title: template.name,
      description: template.description,
      event_date: new Date(currentDate).toISOString(),
      location: template.suggested_location,
      max_capacity: template.default_capacity,
      price: template.default_price,
      is_active: false
    }

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) throw error
    events.push(data)

    // Calculate next date based on recurring options
    currentDate = calculateNextEventDateFromOptions(currentDate, template.recurring_options)
  }

  return events
}

function calculateNextEventDateFromOptions(
  currentDate: Date, 
  options: EventTemplate['recurring_options']
): Date {
  // Handle cases where options might be undefined or null
  if (!options || !options.frequency) {
    return addWeeks(currentDate, 1) // Default to weekly
  }
  
  switch (options.frequency) {
    case 'weekly':
      const weekInterval = 1 // Default to weekly
      const targetDay = options.best_days?.[0] || 0
      const currentDay = currentDate.getDay()
      const daysToAdd = (targetDay - currentDay + 7) % 7
      return addDays(currentDate, daysToAdd + (weekInterval - 1) * 7)
    
    case 'monthly':
      return addMonths(currentDate, 1)
    
    case 'quarterly':
      return addMonths(currentDate, 3)
    
    default:
      return addWeeks(currentDate, 1)
  }
}

export function getRecurrenceDescription(template: EventTemplate): string {
  const { recurring_options } = template
  
  // Handle cases where recurring_options might be undefined or null
  if (!recurring_options || !recurring_options.frequency) {
    return 'No recurrence'
  }
  
  switch (recurring_options.frequency) {
    case 'weekly':
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const bestDay = dayNames[recurring_options.best_days?.[0] || 0]
      return `Weekly on ${bestDay}`
    
    case 'monthly':
      return 'Monthly'
    
    case 'quarterly':
      return 'Quarterly'
    
    default:
      return 'No recurrence'
  }
}

export function validateTemplateData(data: CreateEventTemplateData): string[] {
  const errors: string[] = []

  if (!data.name.trim()) {
    errors.push('Template name is required')
  }

  if (!data.description.trim()) {
    errors.push('Description is required')
  }

  if (data.default_duration <= 0) {
    errors.push('Duration must be greater than 0')
  }

  // Handle cases where recurring_options might be undefined
  if (data.recurring_options) {
    if (data.recurring_options.frequency === 'weekly' && (!data.recurring_options.best_days || data.recurring_options.best_days.length === 0)) {
      errors.push('Day of week is required for weekly recurrence')
    }

    if (data.recurring_options.frequency === 'monthly' && (!data.recurring_options.best_days || data.recurring_options.best_days.length === 0)) {
      errors.push('Day of month is required for monthly recurrence')
    }
  }

  return errors
} 