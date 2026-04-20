"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchEventTemplateById } from "@/lib/eventTemplates"
import { EventTemplate } from "@/types/event"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/loading-states"
import { ArrowLeft, Edit, Trash2, Clock, MapPin, DollarSign, Users, Play } from "lucide-react"
import { getRecurrenceDescription } from "@/lib/eventTemplates"
import { toast } from "sonner"
import { EventGenerationModal } from "@/components/events/EventGenerationModal"

export default function EventTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<EventTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [generationModalOpen, setGenerationModalOpen] = useState(false)

  const loadTemplate = useCallback(async () => {
    try {
      const data = await fetchEventTemplateById(params.id as string)
      setTemplate(data)
    } catch {
      toast.error("Failed to load template")
      router.push('/event-templates')
    } finally {
      setInitialLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    if (params.id) {
      loadTemplate()
    }
  }, [params.id, loadTemplate])

  const handleEdit = () => {
    router.push(`/event-templates/${params.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      await fetch(`/api/event-templates/${params.id}`, {
        method: 'DELETE',
      })
      toast.success("Template deleted successfully")
      router.push('/event-templates')
    } catch {
      toast.error("Failed to delete template")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateEvents = () => {
    setGenerationModalOpen(true)
  }

  const confirmGenerateEvents = async (data: { numberOfEvents: number; startDate: Date }) => {
    setLoading(true)
    try {
      await fetch(`/api/event-templates/${params.id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numberOfEvents: data.numberOfEvents,
          startDate: data.startDate.toISOString(),
        }),
      })
      toast.success(`Generated ${data.numberOfEvents} events successfully`)
      router.push('/events')
    } catch {
      toast.error("Failed to generate events")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <ErrorAlert 
          title="Template not found"
          message="The requested template could not be found."
          onRetry={loadTemplate}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">Event Template Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateEvents} disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            Generate Events
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Template Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
              <p className="text-sm mt-1">{template.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Category</h3>
                <Badge variant="secondary" className="mt-1">{template.category}</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Recurrence</h3>
                <p className="text-sm mt-1">{getRecurrenceDescription(template)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Duration</h3>
                  <p className="text-sm">{template.default_duration} hours</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Capacity</h3>
                  <p className="text-sm">{template.default_capacity} people</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Price</h3>
                  <p className="text-sm">€{template.default_price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Location</h3>
                  <p className="text-sm">{template.suggested_location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Generation Modal */}
      <EventGenerationModal
        template={template}
        open={generationModalOpen}
        onClose={() => setGenerationModalOpen(false)}
        onGenerate={confirmGenerateEvents}
        loading={loading}
      />
    </div>
  )
} 