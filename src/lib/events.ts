import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { Event, EventWithDetails, RSVP, EventFormData, CalendarEvent, EventType } from '@/types/event'
import { RSVPFormData } from '@/lib/validation'
import { RSVPStatus } from '@/types/common'
import { sendEventReminder } from './email'
import { format } from 'date-fns'
import { api } from '@/lib/api/client'

export async function fetchEvents({ 
  search = '', 
  page = 1, 
  limit = 10,
  dateFrom,
  dateTo,
  location,
  status
}: { 
  search?: string
  page?: number
  limit?: number
  dateFrom?: Date
  dateTo?: Date
  location?: string
  status?: 'draft' | 'published' | 'cancelled'
}) {
  try {
  
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
    if (dateTo) params.append('dateTo', dateTo.toISOString());
    if (location) params.append('location', location);
    if (status) params.append('status', status);
    
    const { data } = await api.get<{ events: EventWithDetails[] }>(`/api/events?${params.toString()}`);
    return { data: data.events || [], count: data.events?.length || 0 };
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
}

export async function fetchEventById(id: string): Promise<EventWithDetails> {
  try {
  
    const response = await api.get<{ event: EventWithDetails }>(`/api/events/${id}`);
    return response.data.event;
  } catch (error) {
    console.error('Failed to fetch event by ID:', error);
    throw error;
  }
}

export async function insertEvent(event: EventFormData): Promise<Event> {
  try {
  
    
    // Transform the data to match API expectations
    const eventData = {
      title: event.title,
      description: event.description,
      date: event.date, // The form sends 'date', map it to 'date' for API
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      capacity: event.capacity, // The form sends 'capacity', map it to 'capacity' for API
      price: event.price
    };
    
    const { data } = await api.post<Event>('/api/events', eventData);
    return data;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error;
  }
}

export async function updateEvent(id: string, updates: Partial<EventFormData>): Promise<Event> {
  try {
  
    
    // Transform the updates to match API expectations
    const updateData: any = { id };
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.date) updateData.date = updates.date; // The form sends 'date'
    if (updates.start_time) updateData.start_time = updates.start_time;
    if (updates.end_time) updateData.end_time = updates.end_time;
    if (updates.location) updateData.location = updates.location;
    if (updates.capacity) updateData.capacity = updates.capacity; // The form sends 'capacity'
    if (updates.price) updateData.price = updates.price;
    
    const { data } = await api.put<Event>('/api/events', updateData);
    return data;
  } catch (error) {
    console.error('Failed to update event:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
  
    await api.delete(`/api/events?id=${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete event:', error);
    throw error;
  }
}

// RSVP functions
export async function createRSVP(rsvp: RSVPFormData & { user_id: string }): Promise<RSVP> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .insert([rsvp])
    .select()
    .single()
  
  if (error) throw error

  // Send event confirmation email if user has email
  try {
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('title, event_date, location')
      .eq('id', rsvp.event_id)
      .single()

    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email')
      .eq('id', rsvp.user_id)
      .single()

    if (event && customer && customer.email) {
      await sendEventReminder({
        customerName: customer.name,
        customerEmail: customer.email,
        eventTitle: event.title,
        eventDate: format(new Date(event.event_date), 'EEEE, MMMM d, yyyy'),
        eventTime: '7:00 PM', // You can make this configurable
        eventLocation: event.location,
        barName: 'Your Bar'
      })
    }
  } catch (emailError) {
    console.error('Failed to send event confirmation email:', emailError)
    // Don't throw error - RSVP was created successfully
  }

  return data as RSVP
}

export async function updateRSVP(id: string, updates: Partial<RSVPFormData>): Promise<RSVP> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as RSVP
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

export async function checkInRSVP(rsvpId: string, checkedIn: boolean): Promise<RSVP> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .update({ checked_in: checkedIn })
    .eq('id', rsvpId)
    .select()
    .single()
  
  if (error) throw error
  return data as RSVP
}

export async function fetchUpcomingEvents(limit = 5): Promise<EventWithDetails[]> {
  const supabase = await createServiceRoleClient()
  const today = new Date()
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      rsvps (
        id,
        status,
        checked_in
      )
    `)
    .gte('event_date', today.toISOString().split('T')[0])
    .eq('is_active', true)
    .order('event_date', { ascending: true })
    .limit(limit)

  if (error) throw error

  // Transform data to include RSVP counts
  const eventsWithDetails = (data as (any & { rsvps: RSVP[] })[]).map(event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    event_date: event.event_date, // Keep the original event_date field
    date: event.event_date, // Also include date for frontend compatibility
    start_time: event.start_time, // Include separate start_time for frontend compatibility
    end_time: event.end_time, // Include separate end_time for frontend compatibility
    time: event.start_time ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}` : null,
    location: event.location,
    category: event.category,
    max_capacity: event.max_capacity,
    current_rsvps: event.current_rsvps,
    price: event.price,
    is_active: event.is_active,
    created_by: event.created_by,
    created_at: event.created_at,
    updated_at: event.updated_at,
    status: event.is_active ? 'published' : 'draft',
    total_rsvps: event.rsvps?.length || event.current_rsvps || 0,
    going_count: event.rsvps?.filter((r: RSVP) => r.status === 'going').length || 0,
    interested_count: event.rsvps?.filter((r: RSVP) => r.status === 'interested').length || 0,
    checked_in_count: event.rsvps?.filter((r: RSVP) => r.checked_in).length || 0,
    creator_name: 'Unknown',
    rsvps: event.rsvps || []
  }))

  return eventsWithDetails as EventWithDetails[]
}

export async function fetchEventRSVPs(eventId: string): Promise<(RSVP & { customer: any })[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .select(`
      *,
      customers!rsvps_user_id_fkey (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (RSVP & { customer: any })[]
}

export async function updateRSVPStatus(rsvpId: string, status: RSVPStatus): Promise<RSVP> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .update({ status })
    .eq('id', rsvpId)
    .select()
    .single()
  
  if (error) throw error
  return data as RSVP
}

export async function updateRSVPCheckIn(rsvpId: string, checkedIn: boolean): Promise<RSVP> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('rsvps')
    .update({ checked_in: checkedIn })
    .eq('id', rsvpId)
    .select()
    .single()
  
  if (error) throw error
  return data as RSVP
}

export async function getEventStats() {
  try {
    const supabase = await createServiceRoleClient()
    
    console.log('getEventStats: Starting to fetch events...')
    
    // Get events with RSVP counts
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        rsvps (
          id,
          status,
          checkin_time
        )
      `)

    if (eventsError) {
      console.error('getEventStats: Error fetching events:', eventsError)
      throw eventsError
    }

    console.log('getEventStats: Events fetched:', events?.length || 0)
    
    const eventsWithRSVPs = events as any[]
    const now = new Date()
    
    // Calculate total RSVPs across all events
    const totalRSVPs = eventsWithRSVPs.reduce((total, event) => {
      return total + (event.rsvps?.length || 0)
    }, 0)
    
    // Calculate average attendance (checked-in RSVPs)
    const totalCheckedIn = eventsWithRSVPs.reduce((total, event) => {
      return total + (event.rsvps?.filter((rsvp: any) => rsvp.checkin_time)?.length || 0)
    }, 0)
    
    const avgAttendance = totalRSVPs > 0 ? (totalCheckedIn / totalRSVPs) * 100 : 0
    
    const stats = {
      total_events: eventsWithRSVPs.length,
      upcoming_events: eventsWithRSVPs.filter(e => new Date(e.event_date) > now && e.is_active).length,
      past_events: eventsWithRSVPs.filter(e => new Date(e.event_date) < now).length,
      total_rsvps: totalRSVPs,
      average_attendance: Math.round(avgAttendance * 100) / 100 // Round to 2 decimal places
    }
    
    console.log('getEventStats: Calculated stats:', stats)
    return stats
    
  } catch (error) {
    console.error('getEventStats: Unexpected error:', error)
    // Return default values on error
    return {
      total_events: 0,
      upcoming_events: 0,
      past_events: 0,
      total_rsvps: 0,
      average_attendance: 0
    }
  }
}

// Event Analytics Summary
export async function getEventAnalyticsSummary() {
  const supabase = await createServiceRoleClient()
  // Example: total events, total RSVPs, average attendance rate
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, event_date')
  if (eventsError) throw eventsError

  const { data: rsvps, error: rsvpsError } = await supabase
    .from('rsvps')
    .select('event_id, status, checked_in')
  if (rsvpsError) throw rsvpsError

  const totalEvents = events.length
  const totalRSVPs = rsvps.length
  const totalCheckedIn = rsvps.filter((r: any) => r.checked_in).length
  const averageAttendanceRate = totalEvents > 0 ? (totalCheckedIn / totalRSVPs) * 100 : 0

  return {
    totalEvents,
    totalRSVPs,
    totalCheckedIn,
    averageAttendanceRate
  }
}

// Event Performance List
export async function getEventsWithPerformance() {
  const supabase = await createServiceRoleClient()
  // Return EventPerformance[] for all events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, event_date, max_capacity')
  if (eventsError) throw eventsError

  const { data: rsvps, error: rsvpsError } = await supabase
    .from('rsvps')
    .select('event_id, status, checked_in')
  if (rsvpsError) throw rsvpsError

  // Example: revenue = RSVPs * 25, profit = revenue - cost
  const performances = events.map((event: any) => {
    const eventRSVPs = rsvps.filter((r: any) => r.event_id === event.id)
    const checkedIn = eventRSVPs.filter((r: any) => r.checked_in).length
    const attendanceRate = eventRSVPs.length > 0 ? (checkedIn / eventRSVPs.length) * 100 : 0
    const revenue = eventRSVPs.length * 25 // Example ticket price
    const cost = 0 // No cost field in current schema
    const profit = revenue - cost
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0
    return {
      event_id: event.id,
      event_title: event.title,
      event_date: event.event_date,
      total_capacity: event.max_capacity || 0,
      total_rsvps: eventRSVPs.length,
      total_attendees: checkedIn,
      attendance_rate: attendanceRate,
      revenue,
      cost,
      profit,
      profit_margin: profitMargin,
      customer_satisfaction: 0,
      social_media_mentions: 0,
      new_customers_acquired: 0,
      repeat_customers: 0,
      average_spend_per_customer: 0,
      peak_attendance_time: '',
      weather_conditions: '',
      competing_events: 0,
      marketing_channels: {
        email: 0,
        social_media: 0,
        word_of_mouth: 0,
        paid_advertising: 0,
        partnerships: 0
      },
      feedback_summary: {
        positive: 0,
        neutral: 0,
        negative: 0,
        common_themes: []
      }
    }
  })
  return performances
}

// Event Optimization Suggestions
export async function getEventOptimization(eventId: string) {
  const supabase = await createServiceRoleClient()
  // Example: suggest increasing capacity if attendance rate > 90%
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, event_date, max_capacity')
    .eq('id', eventId)
    .single()
  if (eventError) throw eventError

  const { data: rsvps, error: rsvpsError } = await supabase
    .from('rsvps')
    .select('status, checked_in')
    .eq('event_id', eventId)
  if (rsvpsError) throw rsvpsError

  const totalRSVPs = rsvps.length
  const checkedIn = rsvps.filter((r: any) => r.checked_in).length
  const attendanceRate = totalRSVPs > 0 ? (checkedIn / totalRSVPs) * 100 : 0

  const suggestions = []
  if (attendanceRate > 90) {
    suggestions.push({
      type: 'capacity',
      title: 'Increase Capacity',
      description: 'Attendance rate is very high. Consider increasing event capacity.',
      impact: 'high',
      effort: 'medium',
      estimated_improvement: 10
    })
  } else if (attendanceRate < 50) {
    suggestions.push({
      type: 'marketing',
      title: 'Boost Marketing',
      description: 'Attendance rate is low. Consider additional marketing efforts.',
      impact: 'medium',
      effort: 'medium',
      estimated_improvement: 20
    })
  }

  return {
    event_id: event.id,
    suggestions,
    next_best_actions: suggestions.map(s => s.title),
    risk_factors: []
  }
}

// Fetch all events, with optional filters
export async function getEvents({ date, type }: { date?: string; type?: EventType } = {}): Promise<CalendarEvent[]> {
  const supabase = await createServiceRoleClient()
  let query = supabase.from('events').select('*');
  if (date) query = query.eq('event_date', date);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('event_date', { ascending: true });
  if (error) throw error;
  return data as CalendarEvent[];
}

// Add a new event
export async function addEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('events')
    .insert([{ ...event }])
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

// Update an existing calendar event
export async function updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>): Promise<CalendarEvent> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

// Delete a calendar event
export async function deleteCalendarEvent(id: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
} 