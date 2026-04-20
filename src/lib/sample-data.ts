import { createApiClient } from '@/utils/supabase/api'

export interface SampleBookingData {
  customer_name: string
  customer_email: string
  customer_phone: string
  party_size: number
  booking_date: string
  start_time: string
  end_time: string
  notes?: string
}

export interface SampleDataResult {
  success: boolean
  message: string
  createdBookings: number
  errors: string[]
}

/* Creates sample booking data for testing and demonstration purposes
   This function generates realistic sample bookings with various dates and party sizes */
export async function createSampleBookings(): Promise<SampleDataResult> {
  const supabase = await createApiClient()
  const result: SampleDataResult = {
    success: false,
    message: '',
    createdBookings: 0,
    errors: []
  }

  try {
    // Sample customer data for bookings
    const sampleCustomers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+44 7700 900123'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+44 7700 900456'
      },
      {
        name: 'Michael Brown',
        email: 'mike.brown@example.com',
        phone: '+44 7700 900789'
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        phone: '+44 7700 900012'
      },
      {
        name: 'David Lee',
        email: 'david.lee@example.com',
        phone: '+44 7700 900345'
      }
    ]

    // Generate sample bookings for the next 30 days
    const today = new Date()
    const sampleBookings: SampleBookingData[] = []

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      // Generate 1-3 bookings per day
      const bookingsPerDay = Math.floor(Math.random() * 3) + 1

      for (let j = 0; j < bookingsPerDay; j++) {
        const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)]
        const partySize = Math.floor(Math.random() * 6) + 1 // 1-6 people
        
        // Generate realistic booking times (lunch and dinner hours)
        const isLunch = Math.random() > 0.5
        let startHour: number
        let endHour: number

        if (isLunch) {
          startHour = Math.floor(Math.random() * 3) + 11 // 11 AM - 1 PM
          endHour = startHour + 1
        } else {
          startHour = Math.floor(Math.random() * 4) + 17 // 5 PM - 8 PM
          endHour = startHour + 2
        }

        const startTime = `${startHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 4) * 15}:00`
        const endTime = `${endHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 4) * 15}:00`

        // Add some variety to dates (some weekends, some weekdays)
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
          // More bookings on weekends
          if (Math.random() > 0.3) {
            sampleBookings.push({
              customer_name: customer.name,
              customer_email: customer.email,
              customer_phone: customer.phone,
              party_size: partySize,
              booking_date: date.toISOString().split('T')[0],
              start_time: startTime,
              end_time: endTime,
              notes: Math.random() > 0.7 ? 'Special occasion' : undefined
            })
          }
        } else { // Weekday
          // Fewer bookings on weekdays
          if (Math.random() > 0.6) {
            sampleBookings.push({
              customer_name: customer.name,
              customer_email: customer.email,
              customer_phone: customer.phone,
              party_size: partySize,
              booking_date: date.toISOString().split('T')[0],
              start_time: startTime,
              end_time: endTime,
              notes: Math.random() > 0.8 ? 'Business lunch' : undefined
            })
          }
        }
      }
    }

    // Insert sample bookings into the database
    let createdCount = 0
    for (const booking of sampleBookings) {
      try {
        // First, create or get customer profile
        let customerId: string

        // Check if customer already exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', booking.customer_email)
          .single()

        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          // Create new customer profile
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: booking.customer_name,
              email: booking.customer_email,
              phone: booking.customer_phone,
              loyalty_points: Math.floor(Math.random() * 100),
              total_visits: Math.floor(Math.random() * 10),
              first_visit_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select('id')
            .single()

          if (customerError) {
            result.errors.push(`Failed to create customer ${booking.customer_name}: ${customerError.message}`)
            continue
          }

          customerId = newCustomer.id
        }

        // Create the booking
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            customer_id: customerId,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            party_size: booking.party_size,
            status: 'confirmed',
            notes: booking.notes
          })

        if (bookingError) {
          result.errors.push(`Failed to create booking for ${booking.customer_name}: ${bookingError.message}`)
        } else {
          createdCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Error processing booking for ${booking.customer_name}: ${errorMessage}`)
      }
    }

    result.success = true
    result.createdBookings = createdCount
    result.message = `Successfully created ${createdCount} sample bookings`

    if (result.errors.length > 0) {
      result.message += ` with ${result.errors.length} errors`
    }

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.message = `Failed to create sample data: ${errorMessage}`
    result.errors.push(errorMessage)
    return result
  }
}

/* Creates sample customer data for testing */
export async function createSampleCustomers(): Promise<SampleDataResult> {
  const supabase = await createApiClient()
  const result: SampleDataResult = {
    success: false,
    message: '',
    createdBookings: 0, 
    errors: []
  }

  try {
    const sampleCustomers = [
      {
        name: 'Alice Cooper',
        email: 'alice.cooper@example.com',
        phone: '+44 7700 900111',
        loyalty_points: 150,
        total_visits: 8
      },
      {
        name: 'Bob Marley',
        email: 'bob.marley@example.com',
        phone: '+44 7700 900222',
        loyalty_points: 75,
        total_visits: 4
      },
      {
        name: 'Charlie Chaplin',
        email: 'charlie.chaplin@example.com',
        phone: '+44 7700 900333',
        loyalty_points: 200,
        total_visits: 12
      }
    ]

    let createdCount = 0
    for (const customer of sampleCustomers) {
      try {
        const { error } = await supabase
          .from('customers')
          .insert({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            loyalty_points: customer.loyalty_points,
            total_visits: customer.total_visits,
            first_visit_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })

        if (error) {
          result.errors.push(`Failed to create customer ${customer.name}: ${error.message}`)
        } else {
          createdCount++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Error processing customer ${customer.name}: ${errorMessage}`)
      }
    }

    result.success = true
    result.createdBookings = createdCount
    result.message = `Successfully created ${createdCount} sample customers`

    if (result.errors.length > 0) {
      result.message += ` with ${result.errors.length} errors`
    }

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.message = `Failed to create sample customers: ${errorMessage}`
    result.errors.push(errorMessage)
    return result
  }
}

/* Cleans up sample data (removes test bookings and customers) */
export async function cleanupSampleData(): Promise<SampleDataResult> {
  const supabase = await createApiClient()
  const result: SampleDataResult = {
    success: false,
    message: '',
    createdBookings: 0,
    errors: []
  }

  try {
    // Remove sample bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('notes', ['Special occasion', 'Business lunch'])

    if (bookingsError) {
      result.errors.push(`Failed to cleanup sample bookings: ${bookingsError.message}`)
    }

    // Remove sample customers (those with example.com emails)
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .like('email', '%@example.com')

    if (customersError) {
      result.errors.push(`Failed to cleanup sample customers: ${customersError.message}`)
    }

    result.success = true
    result.message = 'Sample data cleanup completed'
    result.createdBookings = 0

    if (result.errors.length > 0) {
      result.message += ` with ${result.errors.length} errors`
    }

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.message = `Failed to cleanup sample data: ${errorMessage}`
    result.errors.push(errorMessage)
    return result
  }
}
