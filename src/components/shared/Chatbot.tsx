"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { sendChatbotMessage } from "@/lib/chatbot-api"
import { Sparkles, Bot } from "lucide-react"

// Message interface for chatbot conversation
interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'quick_reply' | 'suggestion' | 'info'
  icon?: React.ReactNode
}

// Quick reply interface for suggested responses
interface QuickReply {
  text: string
  action: string
  icon: React.ReactNode
  category: 'management' | 'operations' | 'analytics'
}

// AI chatbot component for staff assistance
export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Urban Lounge AI assistant. What can I help you with?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      icon: <span className="text-sm">✨</span>
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()

  // Determine if chatbot should be visible based on user role and page
  const shouldShowChatbot = () => {
    // Don't show on menu page
    if (pathname === '/menu') {
      return false
    }
    
    // Don't show if not authenticated
    if (authLoading || !user) {
      return false
    }
    
    // Don't show for customers
    const userRole = user.user_metadata?.role
    if (userRole === 'customer') {
      return false
    }
    
    // Only show for staff and admin
    return userRole === 'staff' || userRole === 'admin'
  }

  // Quick actions context (kept for API context but not displayed in UI)
  const quickReplies: QuickReply[] = [
    // Management
    { text: "Add a customer", action: "add_customer", icon: <span className="text-sm">👥</span>, category: 'management' },
    { text: "Create an event", action: "create_event", icon: <span className="text-sm">🗓️</span>, category: 'management' },
    { text: "Manage inventory", action: "inventory", icon: <span className="text-sm">📦</span>, category: 'management' },
    { text: "Staff scheduling", action: "staff_schedule", icon: <span className="text-sm">⏰</span>, category: 'management' },
    
    // Operations
    { text: "Today's bookings", action: "bookings", icon: <span className="text-sm">🗓️</span>, category: 'operations' },
    { text: "Check waitlist", action: "waitlist", icon: <span className="text-sm">👥</span>, category: 'operations' },
    { text: "Bar hours & location", action: "hours_location", icon: <span className="text-sm">📍</span>, category: 'operations' },
    { text: "Menu & pricing", action: "menu_pricing", icon: <span className="text-sm">☕</span>, category: 'operations' },
    
    // Analytics
    { text: "Sales analytics", action: "sales_analytics", icon: <span className="text-sm">📊</span>, category: 'analytics' },
    { text: "Revenue trends", action: "revenue_trends", icon: <span className="text-sm">📈</span>, category: 'analytics' },
    { text: "Customer insights", action: "customer_insights", icon: <span className="text-sm">👥</span>, category: 'analytics' },
    { text: "Performance metrics", action: "performance_metrics", icon: <span className="text-sm">⚡</span>, category: 'analytics' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const addMessage = (text: string, sender: 'user' | 'bot', type: 'text' | 'quick_reply' | 'suggestion' | 'info' = 'text', icon?: React.ReactNode) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      type,
      icon
    }
    setMessages(prev => [...prev, newMessage])
  }

  const simulateTyping = async () => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage(userMessage, 'user')

    await simulateTyping()

    // Call API for response
    try {
      const context = {
        userRole: user?.user_metadata?.role || 'staff',
        availableActions: quickReplies.map(qr => ({ action: qr.action, text: qr.text, category: qr.category })),
        currentPath: pathname,
        messageHistory: messages.slice(-5).map(m => ({ sender: m.sender, text: m.text }))
      }
      
      const response = await sendChatbotMessage(userMessage, context)
      addMessage(response.response, 'bot', 'info', <Sparkles className="h-4 w-4" />)
    } catch (error) {
      console.error('Error fetching AI response:', error)
      addMessage("I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", 'bot', 'info', <span className="text-sm">⚠</span>)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-96 h-[600px] mb-2 shadow-2xl border-2 border-border bg-card max-h-[calc(100vh-0.5rem)] p-0">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-t-lg m-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-xl">🤖</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Urban Lounge AI</CardTitle>
                  <p className="text-xs opacity-90">Your smart assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 ml-4"
              >
                <span className="text-base">✕</span>
              </Button>
            </div>
            <Badge variant="secondary" className="w-fit text-xs bg-white/20 border-white/30 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Online & Ready
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 flex flex-col min-h-0 m-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-muted text-foreground shadow-md border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.icon && <span className="text-blue-600 dark:text-blue-400">{message.icon}</span>}
                      <span className="text-xs opacity-70 font-medium">
                        {message.sender === 'user' ? 'You' : 'Urban AI'}
                      </span>
                      <span className="text-xs opacity-50">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3 shadow-md border border-border">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm animate-spin text-blue-600 dark:text-blue-400">⟳</span>
                      <span className="text-sm text-muted-foreground">Urban AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span className="text-sm">➤</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Type /help for more options
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Button */}
      {shouldShowChatbot() && (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-110"
          size="lg"
        >
          {isOpen ? <span className="text-xl">✕</span> : <span className="text-xl">💬</span>}
        </Button>
      )}
    </div>
  )
} 