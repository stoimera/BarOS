"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchEventTemplateById, updateEventTemplate } from "@/lib/eventTemplates"
import { EventTemplateForm } from "@/components/events/EventTemplateForm"
import { EventTemplate, UpdateEventTemplateData } from "@/types/event"
import { toast } from "sonner"

export default function EditEventTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<EventTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

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

  const handleSubmit = async (data: UpdateEventTemplateData) => {
    setLoading(true)
    try {
      await updateEventTemplate(params.id as string, data)
      toast.success("Event template updated successfully")
      router.push('/event-templates')
    } catch (error) {
      toast.error("Failed to update event template")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    router.push('/event-templates')
  }

  if (initialLoading) {
    return <div className="text-center py-8">Loading template...</div>
  }

  if (!template) {
    return <div className="text-center py-8">Template not found</div>
  }

  return (
    <EventTemplateForm
      open={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      template={template}
      loading={loading}
    />
  )
} 