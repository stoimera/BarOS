"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { testChatbotAPI, sendChatbotMessage } from "@/lib/chatbot-api"
import { useAuth } from "@/hooks/useAuth"

export function ChatbotTest() {
  const [testResult, setTestResult] = useState<{
    external: boolean
    internal: boolean
    error?: string
  } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testMessage, setTestMessage] = useState("Hello")
  const [response, setResponse] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuth()

  const handleTestAPI = async () => {
    setIsTesting(true)
    try {
      const result = await testChatbotAPI()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        external: false,
        internal: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSendTestMessage = async () => {
    if (!testMessage.trim()) return

    setIsSending(true)
    try {
      const context = {
        userRole: user?.user_metadata?.role || 'staff',
        availableActions: [],
        currentPath: '/admin/test',
        messageHistory: []
      }

      const result = await sendChatbotMessage(testMessage, context)
      setResponse(`${result.response}\n\nSource: ${result.source}`)
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chatbot API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleTestAPI} 
              disabled={isTesting}
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <span className="h-4 w-4 animate-spin">⟳</span>
                  Testing...
                </>
              ) : (
                "Test API Connection"
              )}
            </Button>
          </div>

          {testResult && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              <div className="flex gap-2">
                <Badge variant={testResult.external ? "default" : "secondary"} className="flex items-center gap-1">
                  {testResult.external ? (
                    <>
                      <span className="text-xs">✓</span>
                      External API
                    </>
                  ) : (
                    <>
                      <span className="text-xs">✗</span>
                      External API
                    </>
                  )}
                </Badge>
                <Badge variant={testResult.internal ? "default" : "secondary"} className="flex items-center gap-1">
                  {testResult.internal ? (
                    <>
                      <span className="text-xs">✓</span>
                      Internal API
                    </>
                  ) : (
                    <>
                      <span className="text-xs">✗</span>
                      Internal API
                    </>
                  )}
                </Badge>
              </div>
              {testResult.error && (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-sm">⚠</span>
                  <span className="text-sm">{testResult.error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendTestMessage}
              disabled={isSending || !testMessage.trim()}
              className="flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="h-4 w-4 animate-spin">⟳</span>
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>

          {response && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2">Response:</h4>
              <pre className="text-sm whitespace-pre-wrap">{response}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>NEXT_PUBLIC_CHATBOT_API:</strong> {process.env.NEXT_PUBLIC_CHATBOT_API ? "Set" : "Not set"}
            </div>
            <div>
              <strong>NEXT_PUBLIC_CHATBOT_API_KEY:</strong> {process.env.NEXT_PUBLIC_CHATBOT_API_KEY ? "Set" : "Not set"}
            </div>
            <div>
              <strong>CHATBOT_API:</strong> {process.env.CHATBOT_API ? "Set" : "Not set"}
            </div>
            <div>
              <strong>CHATBOT_API_KEY:</strong> {process.env.CHATBOT_API_KEY ? "Set" : "Not set"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 