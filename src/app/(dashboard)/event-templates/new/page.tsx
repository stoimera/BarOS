"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createEventTemplate } from "@/lib/eventTemplates"
import { EventTemplateForm } from "@/components/events/EventTemplateForm"
import { CreateEventTemplateData, UpdateEventTemplateData } from "@/types/event"
import { toast } from "sonner"

export default function NewEventTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateEventTemplateData | UpdateEventTemplateData) => {
    setLoading(true)
    try {
      await createEventTemplate(data as CreateEventTemplateData)
      toast.success("Event template created successfully")
      router.push('/event-templates')
    } catch (error) {
      toast.error("Failed to create event template")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    router.push('/event-templates')
  }

  return (
    <EventTemplateForm
      open={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      loading={loading}
    />
  )
} 