import { GoogleGenerativeAI } from '@google/generative-ai'

interface ChatbotContext {
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

interface ChatbotRequest {
  message: string
  context: ChatbotContext
  timestamp?: string
  session_id?: string
}

interface ChatbotResponse {
  response: string
  suggestions?: string[]
  source?: 'external' | 'internal' | 'fallback'
  confidence?: number
}

/* Send a message to the chatbot API with fallback mechanisms */
export async function sendChatbotMessage(
  message: string, 
  context: ChatbotContext,
  sessionId?: string
): Promise<ChatbotResponse> {
  
  const requestBody: ChatbotRequest = {
    message,
    context,
    timestamp: new Date().toISOString(),
    session_id: sessionId || 'default'
  }

  // Check if this is a bar operations question that should use internal logic
  const isBarOperationsQuestion = checkIfBarOperationsQuestion(message)
  
  // If it's a bar operations question, skip external API and go straight to internal
  if (isBarOperationsQuestion) {
    // Use internal logic
  } else {
    // Try Google AI SDK for general questions
    if (process.env.NEXT_PUBLIC_CHATBOT_API_KEY) {
      try {
        // Initialize Google AI
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_CHATBOT_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        
        const prompt = `You are UrbanAI, a smart assistant for bar management. The user is asking: "${message}". 
        
        Context: User role is ${context.userRole}. Available actions: ${JSON.stringify(context.availableActions)}. 
        
        Please provide a helpful, specific response about bar management, customer service, events, inventory, or general operations. 
        Keep responses concise and actionable.`
        
        const result = await model.generateContent(prompt)
        const response = result.response.text()
        
        return {
          response,
          suggestions: [],
          source: 'external',
          confidence: 0.9
        }
      } catch (error) {
        console.error('Google AI API error:', error)
      }
    }
  }

  // Fallback to internal API
  try {
    const internalResponse = await fetchWithTimeout(
      '/api/chatbot',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      },
      5000 // 5 second timeout
    )

    if (internalResponse.ok) {
      const data = await internalResponse.json()
      return {
        response: data.response || "I'm sorry, I couldn't process your request.",
        suggestions: data.suggestions || [],
        source: 'internal'
      }
    }
  } catch (error) {
    console.error('Internal chatbot API error:', error)
  }

  // Final fallback to keyword-based responses
  return {
    response: generateFallbackResponse(message),
    suggestions: generateFallbackSuggestions(context.userRole),
    source: 'fallback'
  }
}

/**
 * Check if the message is about bar operations that should use internal logic
 */
function checkIfBarOperationsQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // Bar operations keywords that should use internal logic
  const barOperationsKeywords = [
    // Booking and reservation management
    'confirm booking', 'approve booking', 'accept booking', 'booking confirm',
    'create event', 'event create', 'new event', 'add event',
    'manage event', 'edit event', 'cancel event',
    'rsvp', 'rsvps', 'reservation',
    'waitlist', 'queue', 'wait list',
    
    // Customer management
    'add customer', 'customer add', 'new customer', 'create customer',
    'record visit', 'check in', 'visit record', 'customer visit',
    'loyalty', 'points', 'loyalty points',
    
    // Inventory management
    'inventory', 'stock', 'check inventory', 'manage inventory',
    'low stock', 'reorder', 'stock level',
    
    // Staff management
    'staff schedule', 'schedule staff', 'add shift', 'manage staff',
    'time off', 'hours', 'staff hours',
    
    // Event templates
    'event template', 'template event', 'create template',
    'wine tasting', 'live music', 'qr code',
    
    // General bar operations
    'how to', 'how do i', 'what is the process', 'steps to',
    'menu', 'hours', 'open', 'location', 'phone',
    'analytics', 'report', 'revenue', 'sales',
    'marketing', 'campaign', 'settings', 'configuration'
  ]
  
  // Check if the message contains any bar operations keywords
  return barOperationsKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Generate fallback response based on keywords
 */
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! How can I assist you today? I can help with customers, inventory, events, analytics, and more!"
  } else if (lowerMessage.includes('customer') || lowerMessage.includes('add customer')) {
    return "To add a customer, go to Customers → Add Customer. Enter their details and preferences. The system tracks visits, loyalty points, and preferences automatically!"
  } else if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
    return "Check inventory on the Inventory page. You'll see current levels, low stock alerts, usage patterns, and reorder suggestions. The system helps prevent stockouts!"
  } else if (lowerMessage.includes('event') || lowerMessage.includes('booking')) {
    return "For events, go to Events page. Create events, manage RSVPs, use QR codes for check-ins. Bookings are managed on Bookings page with waitlist support!"
  } else if (lowerMessage.includes('loyalty') || lowerMessage.includes('points')) {
    return "Loyalty points are automatically tracked. Customers earn points for visits and purchases. View and manage loyalty on Customers page under Loyalty tab!"
  } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
    return "We're open daily from 08:00 AM to 00:00 AM. Located at Partizanski Odredi 47. Call +389 123-456-789 for reservations!"
  } else if (lowerMessage.includes('menu') || lowerMessage.includes('drink')) {
    return "Our menu features craft cocktails (€8-16), artisan coffee (€3-6), gourmet bites (€6-12), and premium wines (€6-25/glass). Happy Hour 4-6 PM daily!"
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return "I'm here to help! Ask me about customers, inventory, events, bookings, loyalty, analytics, or general bar information. What would you like to know?"
  } else if (lowerMessage.includes('analytics') || lowerMessage.includes('report')) {
    return "Analytics are available on the Analytics page. Track sales, revenue trends, customer insights, and performance metrics. Data helps optimize operations!"
  } else if (lowerMessage.includes('staff') || lowerMessage.includes('schedule')) {
    return "Manage staff schedules on the Schedule page. Assign shifts, track hours, manage time-off requests, and optimize staffing based on customer volume!"
  } else if (lowerMessage.includes('waitlist') || lowerMessage.includes('queue')) {
    return "The waitlist is managed on Bookings page. Add customers to waitlist, notify when tables become available, and track wait times. Perfect for busy nights!"
  } else {
    return "I'm UrbanAI, your smart assistant. I can help with specific questions about your bar operations, customer management, and business analytics. For now, try asking about customers, inventory, events, or analytics!"
  }
}

/**
 * Generate fallback suggestions based on user role
 */
function generateFallbackSuggestions(userRole: string): string[] {
  if (userRole === 'admin') {
    return [
      "Add a customer",
      "Create an event", 
      "Manage inventory",
      "Staff scheduling",
      "View analytics",
      "Marketing campaigns",
      "System settings"
    ]
  } else {
    return [
      "Add a customer",
      "Create an event",
      "Manage inventory", 
      "Today's bookings",
      "Check waitlist",
      "Loyalty program"
    ]
  }
}

/**
 * Test the chatbot API connection
 */
export async function testChatbotAPI(): Promise<{
  external: boolean
  internal: boolean
  error?: string
}> {
  const testMessage = "Hello"
  const testContext: ChatbotContext = {
    userRole: 'staff',
    availableActions: [],
    currentPath: '/test',
    messageHistory: []
  }

  try {
    const response = await sendChatbotMessage(testMessage, testContext)
    return {
      external: response.source === 'external',
      internal: response.source === 'internal',
      error: response.source === 'fallback' ? 'All APIs failed' : undefined
    }
  } catch (error) {
    return {
      external: false,
      internal: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 