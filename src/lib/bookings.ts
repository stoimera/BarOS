import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { 
  Booking, 
  BookingWithCustomer, 
  CreateBookingData, 
  UpdateBookingData, 
  BookingFilters, 
  BookingStats,
  WaitlistEntry,
  RecurringBooking,
  BookingReminder,
  BookingAnalytics
} from '@/types/booking'
import { format, isToday, isTomorrow, addDays, addWeeks, addMonths, startOfWeek, endOfWeek } from 'date-fns'
import { sendBookingConfirmation, sendBookingReminder } from './email'
import { createNotification } from './notifications'
import { api } from '@/lib/api/client'

export async function fetchBookings({ 
  search = '', 
  page = 1, 
  limit = 10,
  date_from,
  date_to,
  status,
  party_size_min,
  party_size_max,
  time_from,
  time_to,
  sortBy = 'date',
  sortOrder = 'desc'
}: BookingFilters & { page?: number; limit?: number }) {
  try {
  
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (status && status.length > 0) params.append('status', status.join(','));
    if (date_from) params.append('date_from', date_from.toISOString().split('T')[0]);
    if (date_to) params.append('date_to', date_to.toISOString().split('T')[0]);
    if (party_size_min) params.append('party_size_min', party_size_min.toString());
    if (party_size_max) params.append('party_size_max', party_size_max.toString());
    if (time_from) params.append('time_from', time_from);
    if (time_to) params.append('time_to', time_to);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    const { data } = await api.get<{ data: BookingWithCustomer[]; count: number }>(`/api/bookings?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
}

export async function fetchBookingById(id: string): Promise<BookingWithCustomer> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  // Map profile data to customer structure for backward compatibility
  const mappedData = {
    ...data,
    customer: data.profiles ? {
      id: data.profiles.id,
      name: data.profiles.name || 'Unknown',
      email: data.profiles.email,
      phone: data.profiles.phone,
      tags: [],
      notes: '',
      created_at: data.profiles.created_at,
      updated_at: data.profiles.updated_at
    } : {
      id: '',
      name: 'Unknown',
      email: '',
      phone: '',
      tags: [],
      notes: '',
      created_at: new Date(),
      updated_at: new Date()
    }
  }

  return mappedData as BookingWithCustomer
}

export async function createBooking(bookingData: CreateBookingData): Promise<Booking> {
  try {
    console.log('Creating booking with data:', bookingData)
    
    // Transform the data to match what the API expects
    const apiData = {
      customer_name: bookingData.customer_name,
      customer_email: bookingData.customer_email,
      customer_phone: bookingData.customer_phone,
      date: bookingData.date.toISOString().split('T')[0], // Convert Date to string
      time: bookingData.time,
      party_size: bookingData.party_size,
      notes: bookingData.notes,
      user_id: bookingData.user_id
    }
    
    console.log('Transformed API data:', apiData)
    
    const { data } = await api.post<Booking>('/api/bookings', apiData);
    
    // Create notification for the customer who made the booking
    if (bookingData.user_id) {
      try {
        await createNotification({
          user_id: bookingData.user_id,
          title: 'New Booking Created',
          message: `Your booking for ${format(bookingData.date, 'EEEE, MMMM d, yyyy')} at ${bookingData.time} has been created successfully.`,
          type: 'success',
          category: 'event',
          action_url: `/bookings/${data.id}`,
          action_text: 'View Booking',
          metadata: {
            booking_id: data.id,
            booking_date: bookingData.date.toISOString(),
            booking_time: bookingData.time,
            party_size: bookingData.party_size
          }
        });
      } catch (notificationError) {
        console.error('Failed to create notification for new booking:', notificationError);
        // Don't throw error - booking creation should still succeed even if notification fails
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
}

export async function updateBooking(id: string, updates: UpdateBookingData): Promise<Booking> {
  try {
    console.log('Updating booking with data:', { id, updates })
    
    // Transform the data to match what the API expects
    const apiData: any = {}
    if (updates.date !== undefined) apiData.date = updates.date.toISOString().split('T')[0]
    if (updates.time !== undefined) apiData.time = updates.time
    if (updates.party_size !== undefined) apiData.party_size = updates.party_size
    if (updates.status !== undefined) apiData.status = updates.status
    if (updates.notes !== undefined) apiData.notes = updates.notes
    
    console.log('Transformed API update data:', apiData)
    
    const { data } = await api.put<Booking>(`/api/bookings/${id}`, apiData);
    
    // Send confirmation email and notification if booking status is being changed to 'confirmed'
    if (updates.status === 'confirmed') {
      try {
        // Get the updated booking with customer details
        const bookingWithCustomer = await fetchBookingById(id);
        
        if (bookingWithCustomer.customer?.email) {
          // Send email confirmation
          await sendBookingConfirmation({
            customerName: bookingWithCustomer.customer.name || 'Customer',
            customerEmail: bookingWithCustomer.customer.email,
            bookingDate: format(new Date(bookingWithCustomer.date || new Date()), 'EEEE, MMMM d, yyyy'),
            bookingTime: bookingWithCustomer.time || '',
            partySize: bookingWithCustomer.party_size || 1,
            bookingId: bookingWithCustomer.id,
            barName: 'Your Bar' // You can customize this
          });
      
          
          // Create in-app notification for the customer
          try {
            await createNotification({
              user_id: bookingWithCustomer.customer.id,
              title: 'Booking Confirmed!',
              message: `Your booking for ${format(new Date(bookingWithCustomer.date || new Date()), 'EEEE, MMMM d')} at ${bookingWithCustomer.time || ''} has been confirmed.`,
              type: 'success',
              category: 'customer',
              action_url: `/customer/bookings/${bookingWithCustomer.id}`,
              action_text: 'View Booking',
              metadata: {
                booking_id: bookingWithCustomer.id,
                booking_date: bookingWithCustomer.date,
                booking_time: bookingWithCustomer.time,
                party_size: bookingWithCustomer.party_size
              }
            });
        
          } catch (notificationError) {
            console.error('Failed to create booking confirmation notification:', notificationError);
            // Don't throw error - booking update should still succeed even if notification fails
          }
        }
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
        // Don't throw error - booking update should still succeed even if email fails
      }
    }
    
    // Create notification for other booking updates (time, date, party size changes)
    if ((updates.date || updates.time || updates.party_size) && updates.status !== 'confirmed') {
      try {
        const bookingWithCustomer = await fetchBookingById(id);
        
        if (bookingWithCustomer.customer?.id) {
          let updateMessage = 'Your booking has been updated.';
          if (updates.date) updateMessage += ` New date: ${format(new Date(updates.date), 'EEEE, MMMM d')}.`;
          if (updates.time) updateMessage += ` New time: ${updates.time}.`;
          if (updates.party_size) updateMessage += ` New party size: ${updates.party_size} guests.`;
          
          await createNotification({
            user_id: bookingWithCustomer.customer.id,
            title: 'Booking Updated',
            message: updateMessage,
            type: 'info',
            category: 'customer',
            action_url: `/customer/bookings/${bookingWithCustomer.id}`,
            action_text: 'View Booking',
            metadata: {
              booking_id: bookingWithCustomer.id,
              booking_date: updates.date || bookingWithCustomer.date,
              booking_time: updates.time || bookingWithCustomer.time,
              party_size: updates.party_size || bookingWithCustomer.party_size
            }
          });
        }
      } catch (notificationError) {
        console.error('Failed to create booking update notification:', notificationError);
        // Don't throw error - booking update should still succeed even if notification fails
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update booking:', error);
    throw error;
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    console.log('deleteBooking - using API');
    
    // Get booking details before deletion to create notification
    const bookingWithCustomer = await fetchBookingById(id);
    
    const response = await api.delete<{ success: boolean }>(`/api/bookings/${id}`);
    
    // Check if the deletion was successful
    if (!response.data?.success) {
      throw new Error('Failed to delete booking: API did not return success');
    }
    
    // Create notification for booking cancellation
    if (bookingWithCustomer.customer?.id) {
      try {
        await createNotification({
          user_id: bookingWithCustomer.customer.id,
          title: 'Booking Cancelled',
          message: `Your booking for ${format(new Date(bookingWithCustomer.date || new Date()), 'EEEE, MMMM d')} at ${bookingWithCustomer.time || ''} has been cancelled.`,
          type: 'warning',
          category: 'customer',
          action_url: '/customer/bookings',
          action_text: 'View Bookings',
          metadata: {
            booking_id: bookingWithCustomer.id,
            booking_date: bookingWithCustomer.date,
            booking_time: bookingWithCustomer.time,
            party_size: bookingWithCustomer.party_size
          }
        });
        console.log('Booking cancellation notification created for customer:', bookingWithCustomer.customer.id);
      } catch (notificationError) {
        console.error('Failed to create booking cancellation notification:', notificationError);
        // Don't throw error - booking deletion should still succeed even if notification fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete booking:', error);
    throw error;
  }
}

export async function getBookingStats(): Promise<BookingStats> {
  try {
    const supabase = await createServiceRoleClient()
    
    console.log('getBookingStats: Starting to fetch bookings...')
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')

    if (error) {
      console.error('getBookingStats: Error fetching bookings:', error)
      throw error
    }

    console.log('getBookingStats: Bookings fetched:', data?.length || 0)
    
    const bookings = data as Booking[]
    
    // Calculate stats with proper error handling
    const stats: BookingStats = {
      total_bookings: bookings.length,
      pending_bookings: bookings.filter(b => b.status === 'pending').length,
      confirmed_bookings: bookings.filter(b => b.status === 'confirmed').length,
      completed_bookings: bookings.filter(b => b.status === 'completed').length,
      cancelled_bookings: bookings.filter(b => b.status === 'cancelled').length,
      average_party_size: bookings.length > 0 
        ? Math.round(bookings.reduce((sum, b) => sum + (b.party_size || 1), 0) / bookings.length)
        : 0,
      total_guests: bookings.reduce((sum, b) => sum + (b.party_size || 1), 0)
    }

    console.log('getBookingStats: Calculated stats:', stats)
    return stats
    
  } catch (error) {
    console.error('getBookingStats: Unexpected error:', error)
    // Return default values on error
    return {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      average_party_size: 0,
      total_guests: 0
    }
  }
}

export async function getTodayBookings(): Promise<BookingWithCustomer[]> {
  const supabase = await createServiceRoleClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customers!inner(
        id,
        name,
        email,
        phone,
        tags,
        notes,
        created_at,
        updated_at
      )
    `)
    .eq('booking_date', todayStr)
    .order('start_time', { ascending: true })

  if (error) throw error

  // Map the joined data to the expected structure
  const mappedData = (data as any[]).map(booking => ({
    ...booking,
    date: booking.booking_date, // Map booking_date to date for backward compatibility
    time: booking.start_time,   // Map start_time to time for backward compatibility
    customer: {
      id: booking.customers?.id || '',
      name: booking.customers?.name || 'Unknown',
      email: booking.customers?.email || '',
      phone: booking.customers?.phone || '',
      tags: booking.customers?.tags || [],
      notes: booking.customers?.notes || '',
      created_at: booking.customers?.created_at ? new Date(booking.customers.created_at) : new Date(),
      updated_at: booking.customers?.updated_at ? new Date(booking.customers.updated_at) : new Date()
    }
  }))

  return mappedData as BookingWithCustomer[]
}

export async function getUpcomingBookings(limit = 10): Promise<BookingWithCustomer[]> {
  const supabase = await createServiceRoleClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customers!inner(
        id,
        name,
        email,
        phone,
        tags,
        notes,
        created_at,
        updated_at
      )
    `)
    .gte('booking_date', todayStr)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) throw error

  // Map the joined data to the expected structure
  const mappedData = (data as any[]).map(booking => ({
    ...booking,
    date: booking.booking_date, // Map booking_date to date for backward compatibility
    time: booking.start_time,   // Map start_time to time for backward compatibility
    customer: {
      id: booking.customers?.id || '',
      name: booking.customers?.name || 'Unknown',
      email: booking.customers?.email || '',
      phone: booking.customers?.phone || '',
      tags: booking.customers?.tags || [],
      notes: booking.customers?.notes || '',
      created_at: booking.customers?.created_at ? new Date(booking.customers.created_at) : new Date(),
      updated_at: booking.customers?.updated_at ? new Date(booking.customers.updated_at) : new Date()
    }
  }))

  return mappedData as BookingWithCustomer[]
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳'
    case 'confirmed':
      return '✅'
    case 'completed':
      return '🎉'
    case 'cancelled':
      return '❌'
    default:
      return '📋'
  }
}

export function formatBookingTime(time: string): string {
  return time
}

export function formatBookingDate(date: Date): string {
  const bookingDate = new Date(date)
  
  if (isToday(bookingDate)) {
    return 'Today'
  } else if (isTomorrow(bookingDate)) {
    return 'Tomorrow'
  } else {
    return format(bookingDate, 'MMM d, yyyy')
  }
}

// Waitlist Management
export async function addToWaitlist(waitlistData: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'>): Promise<WaitlistEntry> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('waitlist')
    .insert([{
      customer_name: waitlistData.customer_name,
      customer_email: waitlistData.customer_email,
      customer_phone: waitlistData.customer_phone,
      date: waitlistData.date.toISOString().split('T')[0],
      time: waitlistData.time,
      party_size: waitlistData.party_size,
      notes: waitlistData.notes,
      priority: waitlistData.priority,
      status: 'waiting'
    }])
    .select()
    .single()

  if (error) throw error
  return data as WaitlistEntry
}

export async function getWaitlistEntries(date?: Date): Promise<WaitlistEntry[]> {
  const supabase = await createServiceRoleClient()
  let query = supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: true })

  if (date) {
    query = query.eq('date', date.toISOString().split('T')[0])
  }

  const { data, error } = await query
  if (error) throw error
  return data as WaitlistEntry[]
}

export async function notifyWaitlistEntry(id: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Send notification email if available
  if (entry.customer_email) {
    try {
      await sendBookingReminder({
        customerName: entry.customer_name,
        customerEmail: entry.customer_email,
        message: `A table has become available for your requested booking on ${format(new Date(entry.date), 'EEEE, MMMM d, yyyy')} at ${entry.time}. Please contact us to confirm your booking.`,
        type: 'waitlist_notification'
      })
    } catch (emailError) {
      console.error('Failed to send waitlist notification:', emailError)
    }
  }

  // Update status to notified
  const { error: updateError } = await supabase
    .from('waitlist')
    .update({ 
      status: 'notified',
      notified_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) throw updateError
}

export async function convertWaitlistToBooking(waitlistId: string, bookingData: CreateBookingData): Promise<Booking> {
  const supabase = await createServiceRoleClient()
  // Create the booking
  const booking = await createBooking(bookingData)

  // Update waitlist entry
  const { error } = await supabase
    .from('waitlist')
    .update({ 
      status: 'booked',
      booked_at: new Date().toISOString()
    })
    .eq('id', waitlistId)

  if (error) throw error

  return booking
}

// Recurring Bookings
export async function createRecurringBooking(recurringData: Omit<RecurringBooking, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringBooking> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('recurring_bookings')
    .insert([{
      user_id: recurringData.user_id,
      customer_name: recurringData.customer_name,
      customer_email: recurringData.customer_email,
      customer_phone: recurringData.customer_phone,
      day_of_week: recurringData.day_of_week,
      time: recurringData.time,
      party_size: recurringData.party_size,
      start_date: recurringData.start_date.toISOString().split('T')[0],
      end_date: recurringData.end_date?.toISOString().split('T')[0],
      frequency: recurringData.frequency,
      is_active: recurringData.is_active,
      notes: recurringData.notes
    }])
    .select()
    .single()

  if (error) throw error
  return data as RecurringBooking
}

export async function getRecurringBookings(): Promise<RecurringBooking[]> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('recurring_bookings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as RecurringBooking[]
}

export async function generateRecurringBookings(): Promise<void> {
  const recurringBookings = await getRecurringBookings()
  const today = new Date()
  const nextWeek = addDays(today, 7)

  for (const recurring of recurringBookings) {
    const startDate = new Date(recurring.start_date)
    const endDate = recurring.end_date ? new Date(recurring.end_date) : nextWeek

    if (startDate <= nextWeek && (!recurring.end_date || endDate >= today)) {
      // Generate bookings for the next week
      let currentDate = startOfWeek(today)
      
      while (currentDate <= endOfWeek(nextWeek)) {
        if (currentDate.getDay() === recurring.day_of_week && currentDate >= today) {
          // Check if booking already exists for this date/time
          const existingBooking = await checkExistingBooking(
            recurring.customer_name,
            currentDate,
            recurring.time
          )

          if (!existingBooking) {
            // Create the booking
            await createBooking({
              user_id: recurring.user_id,
              customer_name: recurring.customer_name,
              customer_email: recurring.customer_email,
              customer_phone: recurring.customer_phone,
              date: currentDate,
              time: recurring.time,
              party_size: recurring.party_size,
              notes: `Recurring booking - ${recurring.notes || ''}`
            })
          }
        }

        // Move to next occurrence based on frequency
        switch (recurring.frequency) {
          case 'weekly':
            currentDate = addWeeks(currentDate, 1)
            break
          case 'bi-weekly':
            currentDate = addWeeks(currentDate, 2)
            break
          case 'monthly':
            currentDate = addMonths(currentDate, 1)
            break
        }
      }
    }
  }
}

async function checkExistingBooking(customerName: string, date: Date, time: string): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('date', date.toISOString().split('T')[0])
    .eq('time', time)
    .or(`customers.name.eq.${customerName}`)
    .limit(1)

  if (error) throw error
  return data && data.length > 0
}

// Booking Analytics
export async function getBookingAnalytics(startDate?: Date, endDate?: Date): Promise<BookingAnalytics> {
  const supabase = await createServiceRoleClient()
  const start = startDate || startOfWeek(new Date())
  const end = endDate || new Date()

  // Get all bookings in date range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('date', start.toISOString().split('T')[0])
    .lte('date', end.toISOString().split('T')[0])

  if (!bookings) {
    return {
      total_bookings: 0,
      confirmed_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      no_show_rate: 0,
      average_party_size: 0,
      total_guests: 0,
      conversion_rate: 0,
      peak_hours: [],
      popular_days: [],
      revenue_per_booking: 0,
      total_revenue: 0,
      waitlist_conversion_rate: 0,
      recurring_bookings_count: 0
    }
  }

  const totalBookings = bookings.length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
  
  const totalGuests = bookings.reduce((sum, b) => sum + b.party_size, 0)
  const averagePartySize = totalBookings > 0 ? totalGuests / totalBookings : 0
  
  const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
  const noShowRate = confirmedBookings > 0 ? ((confirmedBookings - completedBookings) / confirmedBookings) * 100 : 0

  // Calculate peak hours
  const hourCounts: { [key: string]: number } = {}
  bookings.forEach(booking => {
    const hour = booking.time.split(':')[0]
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour, bookings: count }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)

  // Calculate popular days
  const dayCounts: { [key: string]: number } = {}
  bookings.forEach(booking => {
    const day = format(new Date(booking.date), 'EEEE')
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  
  const popularDays = Object.entries(dayCounts)
    .map(([day, count]) => ({ day, bookings: count }))
    .sort((a, b) => b.bookings - a.bookings)

  // Get waitlist conversion rate
  const { data: waitlistEntries } = await supabase
    .from('waitlist')
    .select('status')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  const totalWaitlist = waitlistEntries?.length || 0
  const convertedWaitlist = waitlistEntries?.filter(w => w.status === 'booked').length || 0
  const waitlistConversionRate = totalWaitlist > 0 ? (convertedWaitlist / totalWaitlist) * 100 : 0

  // Get recurring bookings count
  const { data: recurringBookings } = await supabase
    .from('recurring_bookings')
    .select('id')
    .eq('is_active', true)

  const recurringBookingsCount = recurringBookings?.length || 0

  // Calculate revenue (assuming average spend per person)
  const averageSpendPerPerson = 25 // This could be configurable
  const totalRevenue = totalGuests * averageSpendPerPerson
  const revenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0

  return {
    total_bookings: totalBookings,
    confirmed_bookings: confirmedBookings,
    completed_bookings: completedBookings,
    cancelled_bookings: cancelledBookings,
    no_show_rate: Math.round(noShowRate * 100) / 100,
    average_party_size: Math.round(averagePartySize * 100) / 100,
    total_guests: totalGuests,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    peak_hours: peakHours,
    popular_days: popularDays,
    revenue_per_booking: Math.round(revenuePerBooking * 100) / 100,
    total_revenue: totalRevenue,
    waitlist_conversion_rate: Math.round(waitlistConversionRate * 100) / 100,
    recurring_bookings_count: recurringBookingsCount
  }
}

// Booking Reminders
export async function createBookingReminder(reminderData: Omit<BookingReminder, 'id' | 'sent' | 'created_at'>): Promise<BookingReminder> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('booking_reminders')
    .insert([{
      booking_id: reminderData.booking_id,
      reminder_type: reminderData.reminder_type,
      reminder_date: reminderData.reminder_date.toISOString(),
      message: reminderData.message,
      sent: false
    }])
    .select()
    .single()

  if (error) throw error
  return data as BookingReminder
}

export async function sendScheduledReminders(): Promise<void> {
  const supabase = await createServiceRoleClient()
  const now = new Date()
  const { data: reminders, error } = await supabase
    .from('booking_reminders')
    .select(`
      *,
      bookings!inner (
        date,
        time,
        customers!inner (name, email)
      )
    `)
    .eq('sent', false)
    .lte('reminder_date', now.toISOString())

  if (error) throw error

  for (const reminder of reminders || []) {
    try {
      await sendBookingReminder({
        customerName: reminder.bookings.customers.name,
        customerEmail: reminder.bookings.customers.email,
        message: reminder.message,
        type: reminder.reminder_type
      })

      // Mark as sent
      await supabase
        .from('booking_reminders')
        .update({ 
          sent: true,
          sent_at: now.toISOString()
        })
        .eq('id', reminder.id)
    } catch (emailError) {
      console.error('Failed to send reminder:', emailError)
    }
  }
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  
  // Get booking details before updating
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(`
      *,
      customers!bookings_customer_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('id', bookingId)
    .single()

  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('bookings')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (error) throw error

  // Create notification for booking completion
  if (booking?.customers?.id) {
    try {
      await createNotification({
        user_id: booking.customers.id,
        title: 'Booking Completed!',
        message: `Your booking for ${format(new Date(booking.booking_date), 'EEEE, MMMM d')} at ${booking.start_time} has been marked as completed. Thank you for visiting us!`,
        type: 'success',
        category: 'customer',
        action_url: `/customer/bookings/${bookingId}`,
        action_text: 'View Booking',
        metadata: {
          booking_id: bookingId,
          booking_date: booking.booking_date,
          booking_time: booking.start_time,
          party_size: booking.party_size
        }
      });
      console.log('Booking completion notification created for customer:', booking.customers.id);
    } catch (notificationError) {
      console.error('Failed to create booking completion notification:', notificationError);
      // Don't throw error - booking completion should still succeed even if notification fails
    }
  }

  // Store booking completion time for feedback prompt
  if (typeof window !== 'undefined') {
    localStorage.setItem(`booking_time_${bookingId}`, Date.now().toString())
    localStorage.setItem('last_booking_id', bookingId)
  }

  // Check if this booking was from a referral and mark it as completed
  await markReferralCompletedForBooking(bookingId)
}

async function markReferralCompletedForBooking(bookingId: string): Promise<void> {
  try {
    const supabase = await createServiceRoleClient()
    
    // Get the booking to find the customer
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('customer_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) return

    // Find referrals for this customer and mark them as completed
    const { error: referralError } = await supabase
      .from('referrals')
      .update({ 
        completed_booking: true,
        referred_user_id: booking.customer_id
      })
      .eq('referred_user_id', booking.customer_id)
      .eq('completed_booking', false)

    if (referralError) {
      console.error('Error marking referral as completed:', referralError)
    }
  } catch (error) {
    console.error('Error processing referral completion:', error)
  }
} 