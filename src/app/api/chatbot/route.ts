import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withSecurity } from '@/lib/security/api-middleware'
import { z } from 'zod'

const log = createLogger('api.chatbot')

interface ChatbotRequest {
  message: string
  context: {
    userRole: string
    availableActions: Array<{
      action: string
      text: string
      category: string
    }>
    currentPath: string
    messageHistory: Array<{
      sender: string
      text: string
    }>
  }
}

const chatbotRequestSchema = z.object({
  message: z.string().min(1),
  context: z.object({
    userRole: z.string(),
    availableActions: z.array(
      z.object({
        action: z.string(),
        text: z.string(),
        category: z.string(),
      })
    ),
    currentPath: z.string(),
    messageHistory: z.array(
      z.object({
        sender: z.string(),
        text: z.string(),
      })
    ),
  }),
})

export const POST = withSecurity(
  async (_request, { validatedBody }) => {
    try {
      const body = validatedBody as ChatbotRequest
      const { message, context } = body

      // Check if this is a bar operations question that should use internal logic
      const isBarOperationsQuestion = checkIfBarOperationsQuestion(message)

      // If it's a bar operations question, skip external API and go straight to internal
      if (isBarOperationsQuestion) {
        // Use internal logic
      } else {
        // Try Google AI SDK for general questions
        if (process.env.CHATBOT_API_KEY) {
          try {
            // Initialize Google AI
            const genAI = new GoogleGenerativeAI(process.env.CHATBOT_API_KEY)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

            const prompt = `You are UrbanAI, a smart assistant for bar management. The user is asking: "${message}". 
          
          Context: User role is ${context.userRole}. Available actions: ${JSON.stringify(context.availableActions)}. 
          
          Please provide a helpful, specific response about bar management, customer service, events, inventory, or general operations. 
          Keep responses concise and actionable.`

            const result = await model.generateContent(prompt)
            const response = result.response.text()

            return NextResponse.json({
              response,
              suggestions: [],
              source: 'external',
            })
          } catch (externalError) {
            log.error('Google AI API error:', externalError)
            // Continue to internal API as fallback
          }
        }
      }

      // Fallback to internal response logic
      const response = await generateAIResponse(message, context)

      return NextResponse.json({
        response,
        suggestions: generateSuggestions(context),
        source: 'internal',
      })
    } catch (error) {
      log.error('Chatbot API error:', error)
      return NextResponse.json(
        {
          response:
            "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
          error: 'Internal server error',
          source: 'fallback',
        },
        { status: 500 }
      )
    }
  },
  {
    requireAuth: true,
    requireRole: 'staff',
    rateLimitType: 'auth',
    validateBody: chatbotRequestSchema,
    auditAction: 'view',
    auditResourceType: 'task',
  }
)

async function generateAIResponse(
  message: string,
  context: ChatbotRequest['context']
): Promise<string> {
  const lowerMessage = message.toLowerCase()
  const userRole = context.userRole

  // Role-based responses
  if (userRole === 'admin') {
    return generateAdminResponse(lowerMessage)
  } else {
    return generateStaffResponse(lowerMessage)
  }
}

function generateAdminResponse(message: string): string {
  // Booking and reservation management
  if (message.includes('confirm') && message.includes('booking')) {
    return "To confirm a booking:\n1. Go to Bookings page\n2. Find the pending booking in the list\n3. Click the 'Confirm' button next to the booking\n4. The customer will receive an automatic confirmation email\n5. The booking status will change to 'Confirmed' in green\n\nYou can also bulk confirm multiple bookings using the 'Select All' option."
  } else if (
    message.includes('booking') &&
    (message.includes('confirm') || message.includes('approve') || message.includes('accept'))
  ) {
    return "To confirm a booking:\n1. Go to Bookings page\n2. Find the pending booking in the list\n3. Click the 'Confirm' button next to the booking\n4. The customer will receive an automatic confirmation email\n5. The booking status will change to 'Confirmed' in green\n\nYou can also bulk confirm multiple bookings using the 'Select All' option."
  } else if (message.includes('event') && message.includes('create')) {
    return "To create an event:\n1. Go to Events → New Event\n2. Fill in event details (name, date, time, capacity)\n3. Set event category (Wine Tasting, Live Music, etc.)\n4. Add description and special requirements\n5. Click 'Create Event'\n6. The event will appear in the events calendar\n\nYou can also use event templates for recurring events like 'Wine Tasting Wednesdays' or 'Live Music Fridays'!"
  } else if (message.includes('template') && message.includes('event')) {
    return "To create an event template:\n1. Go to Events → Templates\n2. Click 'New Template'\n3. Set template name (e.g., 'Wine Tasting Wednesday')\n4. Configure recurring schedule (weekly, monthly)\n5. Set default capacity, duration, and category\n6. Add standard description and requirements\n7. Save template\n\nTemplates can be used to quickly create recurring events with consistent settings!"
  } else if (message.includes('visit') || message.includes('check in')) {
    return "To record a customer visit:\n1. Go to Customers → Find customer\n2. Click on customer name\n3. Click 'Record Visit' button\n4. Select visit type (dine-in, takeaway, event)\n5. Add visit details (party size, special requests)\n6. Click 'Save Visit'\n7. Loyalty points are automatically awarded\n8. Visit history is updated\n\nVisits are tracked for analytics and loyalty program calculations!"
  } else if (message.includes('event') && message.includes('manage')) {
    return 'To manage events:\n• View all events: Events page → Calendar or List view\n• Edit event: Click on event → Edit button\n• Cancel event: Event details → Cancel button\n• Check RSVPs: Event details → RSVP tab\n• Generate QR codes: Event details → QR Code button\n• Send reminders: Event details → Send Reminder\n\nEvents can be filtered by date, category, or status!'
  } else if (message.includes('event') || message.includes('booking')) {
    return "For event and booking management:\n• Create events: Events → New Event\n• Use templates: Events → Templates\n• Manage bookings: Bookings page → Confirm/Edit\n• Record visits: Customers → Record Visit\n• View calendar: Events page → Calendar view\n• Check RSVPs: Event details → RSVP tab\n\nFor specific actions, ask me about 'creating events', 'using templates', 'recording visits', or 'managing bookings'."
  }

  // Customer management
  if (message.includes('customer') && message.includes('add')) {
    return "To add a customer:\n1. Go to Customers → Add Customer\n2. Enter their name, email, phone number\n3. Add preferences and dietary restrictions\n4. Click 'Save Customer'\n5. The system will automatically track their visits, loyalty points, and preferences for personalized service!"
  } else if (message.includes('customer') || message.includes('add customer')) {
    return 'To add a customer, go to Customers → Add Customer. You can enter their name, email, phone, preferences, and dietary restrictions. The system will automatically track their visits, loyalty points, and preferences for personalized service!'
  }

  // Inventory management
  if (message.includes('inventory') || message.includes('stock')) {
    return 'Check inventory at Inventory page. Items below threshold are highlighted in red. You can view stock history, make adjustments, and get reorder suggestions. The system also tracks usage patterns!'
  }

  // Staff management
  if (message.includes('staff') && message.includes('schedule')) {
    return "To manage staff schedules:\n1. Go to Schedule page\n2. View current week's schedule\n3. Click 'Add Shift' to assign staff\n4. Set start/end times and roles\n5. Staff will receive notifications\n6. Track hours and time-off requests\n\nThe system helps optimize staffing based on expected customer volume!"
  } else if (message.includes('staff') || message.includes('schedule')) {
    return 'Manage staff schedules at Schedule page. You can assign shifts, track hours, and manage time-off requests. The system helps optimize staffing based on expected customer volume!'
  }

  // Analytics and reporting
  if (message.includes('analytics') || message.includes('report')) {
    return 'Analytics are available on the Analytics page. Track sales, revenue trends, customer insights, and performance metrics. Data helps optimize operations!'
  }

  // Marketing
  if (message.includes('marketing') || message.includes('campaign')) {
    return 'Marketing campaigns can be managed on the Marketing page. Create email campaigns, social media posts, and promotional materials. Track engagement and ROI!'
  }

  // Settings
  if (message.includes('settings') || message.includes('configuration')) {
    return 'System settings are available in the Settings page. Configure notifications, integrations, and system preferences. You can also manage user permissions and roles.'
  }

  // Revenue and sales
  if (message.includes('revenue') || message.includes('sales')) {
    return 'Revenue analytics show growth patterns, peak hours, and seasonal variations. Use this data to optimize staffing, menu planning, and marketing campaigns. Track against goals and industry benchmarks!'
  }

  // Loyalty program
  if (message.includes('loyalty') || message.includes('points')) {
    return 'Loyalty Program Tiers:\n🥉 Bronze: 0-99 points (5% off)\n🥈 Silver: 100-299 points (10% off)\n🥇 Gold: 300-599 points (15% off)\n💎 Platinum: 600+ points (20% off)\n\nPoints earned: €1 = 1 point. Manage on Customers page!'
  }

  // Event templates
  if (message.includes('template') && message.includes('event')) {
    return "To create an event template:\n1. Go to Events → Templates\n2. Click 'New Template'\n3. Set template name (e.g., 'Wine Tasting Wednesday')\n4. Configure recurring schedule (weekly, monthly)\n5. Set default capacity, duration, and category\n6. Add standard description and requirements\n7. Save template\n\nTemplates can be used to quickly create recurring events with consistent settings!"
  }

  // Wine tasting events
  if (message.includes('wine') && message.includes('tasting')) {
    return "To create a Wine Tasting event:\n1. Go to Events → New Event\n2. Select 'Wine Tasting' category\n3. Set event name (e.g., 'Wine Tasting Wednesday')\n4. Choose date and time (typically 6-8 PM)\n5. Set capacity (usually 20-30 people)\n6. Add wine list and tasting notes\n7. Set pricing (€25-35 per person)\n8. Add special requirements (wine glasses, spittoons)\n9. Click 'Create Event'\n\nConsider creating a template for recurring wine tastings!"
  }

  // Live music events
  if (message.includes('live') && message.includes('music')) {
    return "To create a Live Music event:\n1. Go to Events → New Event\n2. Select 'Live Music' category\n3. Set event name and artist/band name\n4. Choose date and time (typically 8-11 PM)\n5. Set capacity based on venue space\n6. Add artist bio and music genre\n7. Set pricing (€10-20 cover charge)\n8. Add technical requirements (sound system, stage)\n9. Click 'Create Event'\n\nLive music events are great for attracting customers on slower nights!"
  }

  // RSVP management
  if (message.includes('rsvp') || message.includes('rsvps')) {
    return "To manage RSVPs:\n1. Go to Events → Select event\n2. Click 'RSVP' tab\n3. View confirmed, pending, and declined RSVPs\n4. Send reminders: Click 'Send Reminder' button\n5. Update capacity based on RSVPs\n6. Export RSVP list for event preparation\n7. Track RSVP trends for future events\n\nRSVPs help with event planning and capacity management!"
  }

  // QR codes
  if (message.includes('qr') && message.includes('code')) {
    return "To generate QR codes for events:\n1. Go to Events → Select event\n2. Click 'QR Code' button\n3. Choose QR code type (check-in, ticket, info)\n4. Customize QR code design\n5. Download or print QR codes\n6. Display at event entrance\n7. Scan QR codes for check-ins\n8. Track attendance automatically\n\nQR codes streamline event check-ins and attendance tracking!"
  }

  // Customer visits
  if (message.includes('visit') || message.includes('check in')) {
    return "To record a customer visit:\n1. Go to Customers → Find customer\n2. Click on customer name\n3. Click 'Record Visit' button\n4. Select visit type (dine-in, takeaway, event)\n5. Add visit details (party size, special requests)\n6. Click 'Save Visit'\n7. Loyalty points are automatically awarded\n8. Visit history is updated\n\nVisits are tracked for analytics and loyalty program calculations!"
  }

  // Hours and location
  if (message.includes('hours') || message.includes('open')) {
    return "📍 Location: Partizanski Odredi 47\n🕒 Hours: Daily 08:00 AM - 00:00 AM\n📞 Phone: +389 123-456-789\n🌐 Website: urbanlounge.com\n\nWe're easily accessible by public transport and have parking available!"
  }

  // Menu
  if (message.includes('menu') || message.includes('drink')) {
    return 'Our menu features:\n• Craft cocktails: €8-16\n• Artisan coffee: €3-6\n• Gourmet bites: €6-12\n• Wine selection: €6-25/glass\n• Beer: €4-8\n\nHappy Hour: 4-6 PM daily (20% off drinks)!'
  }

  // Help
  if (message.includes('help') || message.includes('support')) {
    return 'As an admin, you have access to all features including customer management, inventory, events, staff scheduling, analytics, marketing, and system settings. What would you like to know more about?'
  }

  // Default response
  return "I'm UrbanAI, your smart assistant for bar management. As an admin, you have full access to all features. I can help with customers, inventory, events, staff management, analytics, marketing, and system configuration. What would you like to know?"
}

function generateStaffResponse(message: string): string {
  // Booking and reservation management
  if (message.includes('confirm') && message.includes('booking')) {
    return "To confirm a booking:\n1. Go to Bookings page\n2. Find the pending booking in the list\n3. Click the 'Confirm' button next to the booking\n4. The customer will receive an automatic confirmation email\n5. The booking status will change to 'Confirmed' in green"
  } else if (
    message.includes('booking') &&
    (message.includes('confirm') || message.includes('approve') || message.includes('accept'))
  ) {
    return "To confirm a booking:\n1. Go to Bookings page\n2. Find the pending booking in the list\n3. Click the 'Confirm' button next to the booking\n4. The customer will receive an automatic confirmation email\n5. The booking status will change to 'Confirmed' in green"
  } else if (message.includes('event') && message.includes('create')) {
    return "To create an event:\n1. Go to Events page\n2. Click 'New Event'\n3. Fill in event details (name, date, time, capacity)\n4. Set event category and description\n5. Click 'Create Event'\n6. The event will appear in the events calendar"
  } else if (message.includes('event') || message.includes('booking')) {
    return "For booking management:\n• Confirm bookings: Bookings page → Click 'Confirm' button\n• Create events: Events → New Event\n• Manage waitlist: Bookings page → Waitlist tab\n• View calendar: Events page → Calendar view\n\nFor specific actions, ask me about 'confirming bookings', 'creating events', or 'managing waitlist'."
  }

  // Customer management
  if (message.includes('customer') && message.includes('add')) {
    return "To add a customer:\n1. Go to Customers → Add Customer\n2. Enter their name, email, phone number\n3. Add preferences and dietary restrictions\n4. Click 'Save Customer'\n5. The system tracks visits, loyalty points, and preferences automatically!"
  } else if (message.includes('customer') || message.includes('add customer')) {
    return 'To add a customer, go to Customers → Add Customer. Enter their details and preferences. The system tracks visits, loyalty points, and preferences automatically!'
  }

  // Inventory management
  if (message.includes('inventory') || message.includes('stock')) {
    return "Check inventory on the Inventory page. You'll see current levels, low stock alerts, usage patterns, and reorder suggestions. The system helps prevent stockouts!"
  }

  // Loyalty program
  if (message.includes('loyalty') || message.includes('points')) {
    return 'Loyalty points are automatically tracked. Customers earn points for visits and purchases. View and manage loyalty on Customers page under Loyalty tab!'
  }

  // Hours and location
  if (message.includes('hours') || message.includes('open')) {
    return "We're open daily from 08:00 AM to 00:00 AM. Located at Partizanski Odredi 47. Call +389 123-456-789 for reservations!"
  }

  // Menu
  if (message.includes('menu') || message.includes('drink')) {
    return 'Our menu features craft cocktails (€8-16), artisan coffee (€3-6), gourmet bites (€6-12), and premium wines (€6-25/glass). Happy Hour 4-6 PM daily!'
  }

  // Waitlist management
  if (message.includes('waitlist') || message.includes('queue')) {
    return 'The waitlist is managed on Bookings page. Add customers to waitlist, notify when tables become available, and track wait times. Perfect for busy nights!'
  }

  // Event templates
  if (message.includes('template') && message.includes('event')) {
    return "To create an event template:\n1. Go to Events → Templates\n2. Click 'New Template'\n3. Set template name and recurring schedule\n4. Configure default settings\n5. Save template\n\nTemplates help create recurring events quickly!"
  }

  // Wine tasting events
  if (message.includes('wine') && message.includes('tasting')) {
    return "To create a Wine Tasting event:\n1. Go to Events → New Event\n2. Select 'Wine Tasting' category\n3. Set event details and pricing\n4. Add wine list and requirements\n5. Click 'Create Event'\n\nWine tastings are popular and help sell wine!"
  }

  // Live music events
  if (message.includes('live') && message.includes('music')) {
    return "To create a Live Music event:\n1. Go to Events → New Event\n2. Select 'Live Music' category\n3. Add artist details and music genre\n4. Set capacity and pricing\n5. Click 'Create Event'\n\nLive music attracts customers and increases sales!"
  }

  // RSVP management
  if (message.includes('rsvp') || message.includes('rsvps')) {
    return "To manage RSVPs:\n1. Go to Events → Select event\n2. Click 'RSVP' tab\n3. View confirmed and pending RSVPs\n4. Send reminders if needed\n5. Track attendance for planning\n\nRSVPs help with event preparation!"
  }

  // QR codes
  if (message.includes('qr') && message.includes('code')) {
    return "To generate QR codes:\n1. Go to Events → Select event\n2. Click 'QR Code' button\n3. Download or print codes\n4. Display at event entrance\n5. Scan for check-ins\n\nQR codes make check-ins faster!"
  }

  // Customer visits
  if (message.includes('visit') || message.includes('check in')) {
    return "To record a customer visit:\n1. Go to Customers → Find customer\n2. Click 'Record Visit' button\n3. Select visit type and details\n4. Click 'Save Visit'\n5. Points are awarded automatically\n\nVisits track customer loyalty and preferences!"
  }

  // Help
  if (message.includes('help') || message.includes('support')) {
    return "I'm here to help! Ask me about customers, inventory, events, bookings, loyalty, or general bar information. What would you like to know?"
  }

  // Default response
  return "I'm UrbanAI, your smart assistant. I can help with customer management, inventory, events, bookings, and general bar operations. What would you like to know?"
}

/**
 * Check if the message is about bar operations that should use internal logic
 */
function checkIfBarOperationsQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  // Bar operations keywords that should use internal logic
  const barOperationsKeywords = [
    // Booking and reservation management
    'confirm booking',
    'approve booking',
    'accept booking',
    'booking confirm',
    'create event',
    'event create',
    'new event',
    'add event',
    'manage event',
    'edit event',
    'cancel event',
    'rsvp',
    'rsvps',
    'reservation',
    'waitlist',
    'queue',
    'wait list',

    // Customer management
    'add customer',
    'customer add',
    'new customer',
    'create customer',
    'record visit',
    'check in',
    'visit record',
    'customer visit',
    'loyalty',
    'points',
    'loyalty points',

    // Inventory management
    'inventory',
    'stock',
    'check inventory',
    'manage inventory',
    'low stock',
    'reorder',
    'stock level',

    // Staff management
    'staff schedule',
    'schedule staff',
    'add shift',
    'manage staff',
    'time off',
    'hours',
    'staff hours',

    // Event templates
    'event template',
    'template event',
    'create template',
    'wine tasting',
    'live music',
    'qr code',

    // General bar operations
    'how to',
    'how do i',
    'what is the process',
    'steps to',
    'menu',
    'hours',
    'open',
    'location',
    'phone',
    'analytics',
    'report',
    'revenue',
    'sales',
    'marketing',
    'campaign',
    'settings',
    'configuration',
  ]

  // Check if the message contains any bar operations keywords
  return barOperationsKeywords.some((keyword) => lowerMessage.includes(keyword))
}

function generateSuggestions(context: ChatbotRequest['context']): string[] {
  const userRole = context.userRole

  if (userRole === 'admin') {
    return [
      'Add a customer',
      'Create an event',
      'Create event template',
      'Record customer visit',
      'Manage inventory',
      'Staff scheduling',
      'View analytics',
      'Marketing campaigns',
      'System settings',
    ]
  } else {
    return [
      'Add a customer',
      'Create an event',
      'Record customer visit',
      'Manage inventory',
      "Today's bookings",
      'Check waitlist',
      'Loyalty program',
    ]
  }
}
