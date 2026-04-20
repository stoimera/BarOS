"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventTemplate } from "@/types/event"
import { Calendar } from "lucide-react"

interface EventGenerationModalProps {
  template: EventTemplate | null
  open: boolean
  onClose: () => void
  onGenerate: (data: { numberOfEvents: number; startDate: Date }) => Promise<void>
  loading?: boolean
}

export function EventGenerationModal({
  template,
  open,
  onClose,
  onGenerate,
  loading = false
}: EventGenerationModalProps) {
  const [formData, setFormData] = useState({
    numberOfEvents: 4,
    startDate: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return

    try {
      await onGenerate({
        numberOfEvents: formData.numberOfEvents,
        startDate: new Date(formData.startDate)
      })
      onClose()
    } catch {
      // Error handling is done in the parent component
    }
  }

  const handleClose = () => {
    setFormData({
      numberOfEvents: 4,
      startDate: new Date().toISOString().split('T')[0]
    })
    onClose()
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20">
              <span className="text-lg text-blue-600 dark:text-blue-400">▶</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Generate Events
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create multiple events from &quot;{template.name}&quot; template
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Preview */}
          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-sm text-blue-600">🗓️</span>
                Template Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">⏰</span>
                <span className="text-sm">{template.default_duration} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">€{template.default_price} per event</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">👥</span>
                <span className="text-sm">{template.default_capacity} people capacity</span>
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Number of Events
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.numberOfEvents}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfEvents: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter number of events"
                  required
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  Max: 50
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate between 1 and 50 events
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Events will be generated starting from this date
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 sm:flex-none border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="mr-2">▶</span>
                  Generate Events
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 